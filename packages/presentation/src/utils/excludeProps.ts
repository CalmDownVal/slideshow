export type Filter<T extends string = string> = { [K in T]?: true };

export function createFilter<T extends string = string>(list: readonly T[]) {
	const filter: Filter<T> = {};
	for (let i = 0; i < list.length; ++i) {
		filter[list[i]] = true;
	}

	return filter;
}

export function excludeProps<TProps, TFilter extends string = string>(props: TProps, filter: Filter<TFilter>) {
	const filtered = {} as { -readonly [K in keyof TProps]: K extends TFilter ? TProps[K] | undefined : TProps[K] };
	for (const key in props) {
		if (filter[key as never] === true) {
			continue;
		}

		filtered[key] = props[key] as never;
	}

	return filtered;
}
