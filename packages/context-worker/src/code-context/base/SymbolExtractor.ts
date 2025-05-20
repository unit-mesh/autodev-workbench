import { Stack } from '../../base/common/collections/stack';
import { ILanguageServiceProvider } from '../../base/common/languages/languageService';
import { LanguageProfile } from "./LanguageProfile";
import { LanguageProfileUtil } from "./LanguageProfileUtil";
import { LanguageIdentifier } from "../../base/common/languages/languages";
import { Range } from 'web-tree-sitter';

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
    let commentNode = null, extentNode = null, nameNode = null, bodyNode = null;
    let kind: string | null = null;
    let receiver: string | null = null;

    for (let i = 0; i < captures.length; i++) {
      const capture = captures[i];
      const name = capture.name;

      if (name === 'name') {
        nameNode = capture.node;
      } else if (name === 'reference') {
        nameNode = capture.node;
        extentNode = capture.node;
        kind = name;
      } else if (name === 'body') {
        bodyNode = capture.node;
      } else if (name === 'comment') {
        commentNode = commentNode === null ? capture.node :
          (commentNode.startIndex > capture.node.startIndex ? capture.node : commentNode);
      } else if (name === 'receiver') {
        receiver = content.substring(capture.node.startIndex, capture.node.endIndex);
      } else {
        extentNode = capture.node;
        kind = name;
      }
    }

    if (kind === 'definition.module.filescoped') {
      if (bodyNode) {
        bodyNode.endIndex = content.length;
      }
      if (extentNode) {
        extentNode.endIndex = content.length;
      }
    }

    if (!extentNode && !nameNode) {
      return null;
    }

    // Create ranges from tree-sitter nodes
    const createRangeFromNode = (node: any): Range | null => {
      if (!node) return null;
      return {
        startIndex: node.startIndex,
        endIndex: node.endIndex,
        startPosition: { row: node.startPosition.row, column: node.startPosition.column },
        endPosition: { row: node.endPosition.row, column: node.endPosition.column }
      };
    };

    const commentRange = createRangeFromNode(commentNode) || {
      startIndex: 0, endIndex: 0,
      startPosition: { row: 0, column: 0 },
      endPosition: { row: 0, column: 0 }
    };
    const nameRange = createRangeFromNode(nameNode) || {
      startIndex: 0, endIndex: 0,
      startPosition: { row: 0, column: 0 },
      endPosition: { row: 0, column: 0 }
    };
    const bodyRange = createRangeFromNode(bodyNode) || {
      startIndex: 0, endIndex: 0,
      startPosition: { row: 0, column: 0 },
      endPosition: { row: 0, column: 0 }
    };
    const extentRange = createRangeFromNode(extentNode) || {
      startIndex: 0, endIndex: 0,
      startPosition: { row: 0, column: 0 },
      endPosition: { row: 0, column: 0 }
    };

    // 提取注释内容
    const commentText = commentRange.startIndex > 0 && commentRange.endIndex > 0
      ? content.substring(commentRange.startIndex, commentRange.endIndex)
      : '';

    const symbol = new CodeSymbol(
      filePath,
      '',
      '',
      commentText,
      commentRange,
      nameRange,
      bodyRange,
      extentRange,
      SymbolExtractor.kindFromString(kind),
      0
    );

    if (symbol) {
      SymbolExtractor.updateScopesForSymbol(stack, symbol);

      const symbolName = nameRange.startIndex > 0 ?
        content.substring(nameRange.startIndex, nameRange.endIndex) : '';
      let qualifiedName = this.createNameFromScopes(content, stack.toArray());
      qualifiedName = receiver ? `${receiver}.${qualifiedName}` : qualifiedName;

      return new CodeSymbol(
        filePath,
        qualifiedName,
        symbolName.substring(symbolName.lastIndexOf('.') + 1),
        commentText,
        commentRange,
        nameRange,
        bodyRange,
        extentRange,
        symbol.kind,
        0
      );
    }

    return null;
  }

  static updateScopesForSymbol(stack: Stack<CodeSymbol>, symbol: CodeSymbol) {
    while (stack.tryPeek() && !this.rangeContains(stack.peek()?.extentRange, symbol.extentRange)) {
      stack.pop();
    }

    stack.push(symbol);
  }

  static rangeContains(outer: Range | undefined, inner: Range): boolean {
    if (!outer) return false;
    return outer.startIndex <= inner.startIndex && outer.endIndex >= inner.endIndex;
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
    return scopes.map(s => content.substring(s.nameRange.startIndex, s.nameRange.endIndex)).join('.');
  }
}
