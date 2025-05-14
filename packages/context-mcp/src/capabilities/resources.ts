import { ResourceLike } from "./resources/_typing.js";
import { installVersionResource } from "./resources/version";

export const resources: ResourceLike[] = [
    installVersionResource,
];
