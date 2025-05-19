import { Range } from '../../base/common/range';
import { Stack } from '../../base/common/collections/stack';
import { ILanguageServiceProvider } from '../../base/common/languages/languageService';
import { LanguageProfile } from "./LanguageProfile";
import { LanguageProfileUtil } from "./LanguageProfileUtil";
import { LanguageIdentifier } from "../../base/common/languages/languages";

export enum SymbolKind {
  Class = 0,
  Constant = 1,
  Enum = 2,
  EnumMember = 3,
  Field = 4,
  Function = 5,
  Implementation = 6,
  Interface = 7,
  Macro = 8,
  Method = 9,
  Module = 10,
  Struct = 11,
  Trait = 12,
  Type = 13,
  Union = 14,
  Variable = 15,
  Reference = 16,
  Import = 17,
  Wildcard = 18,
  Alias = 19
}

export class CodeSymbol {
  constructor(
    public readonly uri: string,
    public readonly qualifiedName: string,
    public readonly name: string,
    public readonly comment: string,
    public readonly commentRange: Range,
    public readonly nameRange: Range,
    public readonly bodyRange: Range,
    public readonly extentRange: Range,
    public readonly kind: SymbolKind,
    public readonly depth: number
  ) {}
}

export class SymbolExtractor {
  private queriesCache = new Map<string, any>();

  constructor(private readonly languageId: LanguageIdentifier,
              private readonly languageService: ILanguageServiceProvider) {}

  async findMatches(content: string, query: string) {
    const parser = await this.languageService.getParser(this.languageId);
    const goLanguage = await this.languageService.getLanguage(this.languageId);
    parser.setLanguage(goLanguage);

    const tree = parser!!.parse(content);
    let language = tree.getLanguage();
    let matches = this.getOrCreateQuery(language, query).matches(tree.rootNode);
    return { tree, matches };
  }

  async executeQuery(filePath: string, content: string): Promise<CodeSymbol[]> {
    const profile: LanguageProfile = LanguageProfileUtil.from(this.languageId)!!;
    let result;
    try {
      let query = profile.symbolExtractor.queryString();
      result = await this.findMatches(content, query);
      let symbolStack = new Stack<CodeSymbol>();
      let symbols: CodeSymbol[] = [];

      for (let match of result.matches) {
        let symbol = this.createSymbolRange(symbolStack, filePath, content, match.captures);
        if (symbol) {
          symbols.push(symbol);
        }
      }

      return symbols;
    } catch (e) {
      console.error('Error executing symbol query path: ', filePath);
      console.error('Error executing symbol query:', e);
      return [];
    } finally {
      result?.tree.delete();
    }
  }

  private getOrCreateQuery(language: any, query: string) {
    let cachedQuery = this.queriesCache.get(query);
    if (!cachedQuery) {
      cachedQuery = language.query(query);
      this.queriesCache.set(query, cachedQuery);
    }
    return cachedQuery;
  }

  private createSymbolRange(stack: Stack<CodeSymbol>, filePath: string, content: string, captures: any[]): CodeSymbol | null {
    let commentStart = 0, commentEnd = 0;
    let extentStart = 0, extentEnd = 0;
    let nameStart = 0, nameEnd = 0;
    let bodyStart = 0, bodyEnd = 0;
    let kind: string | null = null;
    let receiver: string | null = null;

    for (let i = 0; i < captures.length; i++) {
      const capture = captures[i];
      const name = capture.name;

      if (name === 'name') {
        nameStart = capture.node.startIndex;
        nameEnd = capture.node.endIndex;
      } else if (name === 'reference') {
        nameStart = capture.node.startIndex;
        nameEnd = capture.node.endIndex;
        extentStart = capture.node.startIndex;
        extentEnd = capture.node.endIndex;
        kind = name;
      } else if (name === 'body') {
        bodyStart = capture.node.startIndex;
        bodyEnd = capture.node.endIndex;
      } else if (name === 'comment') {
        commentStart = commentStart === 0 ? capture.node.startIndex : Math.min(commentStart, capture.node.startIndex);
        commentEnd = Math.max(commentEnd, capture.node.endIndex);
      } else if (name === 'receiver') {
        receiver = Range.fromBounds(capture.node.startIndex, capture.node.endIndex).getText(content);
      } else {
        extentStart = capture.node.startIndex;
        extentEnd = capture.node.endIndex;
        kind = name;
      }
    }

    if (kind === 'definition.module.filescoped') {
      bodyEnd = content.length;
      extentEnd = bodyEnd;
    }

    const extentRange = Range.fromBounds(extentStart, extentEnd);

    const hasRange = extentStart > 0 || extentEnd > 0 || nameStart > 0 || nameEnd > 0;
    if (!hasRange) {
      return null;
    }

    // 提取注释内容
    const commentText = commentStart > 0 && commentEnd > 0
      ? content.substring(commentStart, commentEnd)
      : '';

    const symbol = new CodeSymbol(
      filePath,
      '',
      '',
      commentText,
      Range.fromBounds(commentStart, commentEnd),
      Range.fromBounds(nameStart, nameEnd),
      Range.fromBounds(bodyStart, bodyEnd),
      extentRange,
      SymbolExtractor.kindFromString(kind),
      0
    );

    if (symbol) {
      SymbolExtractor.updateScopesForSymbol(stack, symbol);

      const symbolName = symbol.nameRange.getText(content);
      let qualifiedName = this.createNameFromScopes(content, stack.toArray());
      qualifiedName = receiver ? `${receiver}.${qualifiedName}` : qualifiedName;

      return new CodeSymbol(
        filePath,
        qualifiedName,
        symbolName.substring(symbolName.lastIndexOf('.') + 1),
        commentText,
        symbol.commentRange,
        symbol.nameRange,
        symbol.bodyRange,
        symbol.extentRange,
        symbol.kind,
        0
      );
    }

    return null;
  }

  static updateScopesForSymbol(stack: Stack<CodeSymbol>, symbol: CodeSymbol) {
    while (stack.tryPeek() && !stack.peek()?.extentRange.containsRange(symbol.extentRange)) {
      stack.pop();
    }

    stack.push(symbol);
  }

  static kindFromString(kind: string | null): SymbolKind {
    if (!kind) return SymbolKind.Variable;

    switch (kind) {
      case 'definition.class': return SymbolKind.Class;
      case 'definition.constant': return SymbolKind.Constant;
      case 'definition.enum_variant': return SymbolKind.EnumMember;
      case 'definition.enum': return SymbolKind.Enum;
      case 'definition.field': return SymbolKind.Field;
      case 'definition.function': return SymbolKind.Function;
      case 'definition.implementation': return SymbolKind.Implementation;
      case 'definition.interface': return SymbolKind.Interface;
      case 'definition.macro': return SymbolKind.Macro;
      case 'definition.method': return SymbolKind.Method;
      case 'import.module':
      case 'definition.module':
      case 'definition.module.filescoped': return SymbolKind.Module;
      case 'definition.struct': return SymbolKind.Struct;
      case 'definition.trait': return SymbolKind.Trait;
      case 'definition.type': return SymbolKind.Type;
      case 'type': return SymbolKind.Type;
      case 'impl-type': return SymbolKind.Type;
      case 'definition.union': return SymbolKind.Union;
      case 'definition.variable': return SymbolKind.Variable;
      case 'reference': return SymbolKind.Reference;
      case 'import': return SymbolKind.Import;
      case 'wildcard': return SymbolKind.Wildcard;
      case 'alias': return SymbolKind.Alias;
      default:
        console.warn(`不支持的符号类型: ${kind}，将使用默认类型 Variable`);
        return SymbolKind.Variable;
    }
  }

  private createNameFromScopes(content: string, scopes: CodeSymbol[]): string {
    return scopes.map(s => s.nameRange.getText(content)).join('.');
  }
}
