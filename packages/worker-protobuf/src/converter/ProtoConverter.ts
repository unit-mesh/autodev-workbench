/// generate by claude: https://claude.ai/chat/b442bf21-2348-442f-80ac-647c19918e58
import protobuf, { Field, ReflectionObject, Root, Service, Type } from "protobufjs";

export function proto2mermaid(protoContent: string) {
  /// use regex to remove package default in protoContent
  const packageRegex = /^package\s+[\w.]+\s*;/gm;
  protoContent = protoContent.replace(packageRegex, "package genify;");

  /// replace import too;
  const importRegex = /^import\s+[\w.]+\s*;/gm;
  protoContent = protoContent.replace(importRegex, "");

  if (!protoContent) {
    console.error("Empty proto content");
    return "";
  }

  let root: Root | null = null;
  try {
    root = protobuf.parse(protoContent).root;
  } catch (e) {
    console.error(e);
    return "";
  }

  const defaultHeader = "classDiagram\n\n";
  let mermaidContent = defaultHeader;

  try {
    if (root.nested) {
      const objects = Object.values(root.nested);
      const types: Type[] = [];
      const services: Service [] = [];

      objects.forEach((obj: ReflectionObject) => {
        const keys: string[] = Object.keys(obj);
        for (let i = 0; i < Object.values(obj).length; i++) {
          const item = Object.values(obj)[i];
          const itemKey = keys[i];

          if (!item) {
            continue;
          }

          if (item instanceof Type) {
            types.push(item);
            mermaidContent += processMessageType(item);
          } else if (item instanceof Service) {
            services.push(item);
            mermaidContent += processServiceType(item, types);
          } else if (item instanceof Object) {
            const isEnum = Object.values(item).every(value => typeof value === "number");
            if (isEnum) {
              mermaidContent += processEnumType(itemKey, Object.keys(item));
            }
          }
        }
      });

      services.forEach(service => {
        Object.values(service.methods).forEach(method => {
          const requestType = types.find(type => type.name === method.requestType);
          const responseType = types.find(type => type.name === method.responseType);
          if (requestType) {
            mermaidContent += `${service.name} --> ${requestType.name}\n`;
          }
          if (responseType) {
            mermaidContent += `${service.name} --> ${responseType.name}\n`;
          }
        });
      });

      /// types to types
      types.forEach(type => {
        Object.values(type.fields).forEach(field => {
          console.log(field);
          if (field.type) {
            const resolvedType = types.find(t => t.name === field.type);
            if (resolvedType) {
              mermaidContent += `${type.name} --> ${resolvedType.name}\n`;
            }
          }
        });
      });
    }
  } catch (e) {
    console.error(e);
    return "";
  }

  if (mermaidContent == defaultHeader) {
    console.error("No message type found");
    return "";
  }

  console.log(mermaidContent);
  return mermaidContent;
}

function processMessageType(type: Type): string {
  let mermaidContent = `class ${type.name} {\n`;

  let content = "";
  Object.values(type.fields).forEach(field => {
    const fieldType = getFieldType(field);
    const repeated = field.repeated ? "[]" : "";
    content += `    ${fieldType}${repeated} ${field.name}\n`;
  });

  if (content.length == 0) {
    content += "   // empty\n";
  }

  mermaidContent += content;

  mermaidContent += "}\n";

  return mermaidContent;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function processServiceType(entry: Service, types: Type[]): string {
  let mermaidContent = `class ${entry.name} {\n`;

  let content = "";

  const methods = Object.entries(entry.methods);
  methods.forEach(([name, value]) => {
    content += `    ${value.responseType} ${name}\n`;
  });

  if (content.length == 0) {
    content += "   // empty\n";
  }

  mermaidContent += content;
  mermaidContent += "}\n";

  return mermaidContent;
}

function processEnumType(itemName: string, values: string[]) {
  let mermaidContent = `class ${itemName} {\n    <<enumeration>>\n`;

  let content = "";
  values.forEach(value => {
    content += `    ${value}\n`;
  });

  if (content.length == 0) {
    content += "   // empty\n";
  }

  mermaidContent += content;
  return mermaidContent + "}\n";
}

function getFieldType(field: Field): string {
  if (field.resolvedType) {
    return field.resolvedType.name;
  }

  // 映射 protobuf 类型到对应的 JavaScript 类型
  const typeMapping: any = {
    "double": "number",
    "float": "number",
    "int32": "number",
    "int64": "number",
    "uint32": "number",
    "uint64": "number",
    "sint32": "number",
    "sint64": "number",
    "fixed32": "number",
    "fixed64": "number",
    "sfixed32": "number",
    "sfixed64": "number",
    "bool": "boolean",
    "string": "string",
    "bytes": "Uint8Array",
  };

  return typeMapping[field.type] || field.type;
}
