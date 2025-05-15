import { ApiResource } from '@autodev/worker-core';

export function toFlatPackage(apiResources: ApiResource[]) {
  const apiMap: any = {};
  for (const element of apiResources) {
    apiMap["root/" + element.sourceUrl] = {
      name: "root/rpc/" + element.sourceUrl,
      value: element.className + "." + element.methodName,
    };
  }

  const dataMap = Object.values(apiMap);
  return dataMap;
}

export function hierarchyByPath(data: any, delimiter = "/") {
  let root;
  const map = new Map();
  data.forEach(function find(data: any) {
    const { name, value, lines } = data;
    if (map.has(name)) return map.get(name);
    const i = name.lastIndexOf(delimiter);
    map.set(name, data);
    if (i >= 0) {
      const found = find({ name: name.substring(0, i), children: [] });
      if (found.children) {
        found.children.push(data);
      } else {
        return data;
      }
      data.name = name.substring(i + 1);
      data.value = value || 1;
      data.lines = lines || 1;
    } else {
      root = data;
    }
    return data;
  });

  return root;
}

export function packageHierarchy(apiResources: ApiResource[] = []) {
  if (!apiResources) {
    return null;
  }

  const dataMap = toFlatPackage(apiResources);
  const data = hierarchyByPath(dataMap) as any;
  if (!data) {
    return null;
  }

  return data.children[0];
}

