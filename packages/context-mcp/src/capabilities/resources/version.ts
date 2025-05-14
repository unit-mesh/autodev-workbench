import { ResourceLike } from "./_typing.js";

export const installVersionResource: ResourceLike = (installer) => {
    installer("version", "mcp://version", { list: undefined }, (uri) => {
        return { contents: [{ uri: uri.href, text: "1.0.0" }] };
    });
};
