export type OptionalKeysOf<T> = { [K in keyof T]: undefined extends T[K] ? K : never }[keyof T];
export type OptionalsOf<T> = { [K in OptionalKeysOf<T>]?: T[K] };
