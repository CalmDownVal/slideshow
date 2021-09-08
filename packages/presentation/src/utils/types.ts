export type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export type OptionalKeysOf<T> = { [K in keyof T]: undefined extends T[K] ? K : never }[keyof T];

export type OptionalsOf<T> = { [K in OptionalKeysOf<T>]?: T[K] };
