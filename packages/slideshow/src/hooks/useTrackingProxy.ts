import { useLayoutEffect, useMemo } from 'preact/hooks';

import { Signal, subscribe } from '~/utils/Signal';

import { useForceUpdate } from './useForceUpdate';

function createTrackingProxy<TSource, TKeys extends keyof TSource>(source: TSource, proxyKeys: readonly TKeys[]) {
	const accessMap: Record<keyof any, boolean | undefined> = {};
	const copiedValues: Record<keyof any, any> = {};

	const valueKeys: (keyof TSource)[] = [];
	const proxy: any = {
		syncProxiedValues() {
			let hasTrackedChanges = false;
			for (let key: keyof TSource, value, i = 0; i < valueKeys.length; ++i) {
				key = valueKeys[i];
				value = source[key];
				hasTrackedChanges ||= accessMap[key] && copiedValues[key] !== value;
				copiedValues[key] = value;
				accessMap[key] = false;
			}

			return hasTrackedChanges;
		}
	};

	for (let key: keyof TSource, value: any, i = 0; i < proxyKeys.length; ++i) {
		key = proxyKeys[i];
		value = source[key];
		if (typeof value === 'function') {
			proxy[key] = () => value.apply(source, arguments);
			continue;
		}

		valueKeys.push(key);
		copiedValues[key] = value;
		Object.defineProperty(proxy, key, {
			get() {
				accessMap[key] = true;
				return copiedValues[key];
			}
		});
	}

	return proxy as { [K in TKeys]: TSource[K] } & { syncProxiedValues(): boolean };
}

export function useTrackingProxy<TSource, TKeys extends keyof TSource>(
	source: TSource | null | undefined,
	sourceChanged: Signal | null | undefined,
	keys: readonly TKeys[]
) {
	const forceUpdate = useForceUpdate();
	const proxy = useMemo(() => source && createTrackingProxy(source, keys), [ source, keys ]);

	useLayoutEffect(() => {
		if (!(proxy && sourceChanged)) {
			return undefined;
		}

		return subscribe(sourceChanged, () => {
			if (proxy.syncProxiedValues()) {
				forceUpdate();
			}
		});
	}, [ proxy, sourceChanged ]);

	return proxy;
}
