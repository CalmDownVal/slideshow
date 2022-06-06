import { useLayoutEffect, useMemo } from 'preact/hooks';

import { Signal, subscribe } from '~/utils/Signal';

import { useForceUpdate } from './useForceUpdate';

function createTrackingProxy<TSource, TKeys extends keyof TSource>(firstSource: TSource, proxyKeys: readonly TKeys[]) {
	const accessMap: Record<keyof any, boolean | undefined> = {};
	const copiedValues: Record<keyof any, any> = {};
	const proxy = {
		syncProxiedValues(source: TSource = firstSource) {
			let hasTrackedChanges = false;
			for (let key: keyof TSource, value, i = 0; i < proxyKeys.length; ++i) {
				key = proxyKeys[i];
				value = source[key];
				if (accessMap[key] && copiedValues[key] !== value) {
					hasTrackedChanges = true;
					accessMap[key] = false;
				}

				copiedValues[key] = value;
			}

			return hasTrackedChanges;
		}
	};

	for (let key: keyof TSource, i = 0; i < proxyKeys.length; ++i) {
		key = proxyKeys[i];
		copiedValues[key] = firstSource[key];
		Object.defineProperty(proxy, key, {
			get() {
				accessMap[key] = true;
				return copiedValues[key];
			}
		});
	}

	return proxy as { readonly [K in TKeys]: TSource[K] } & { syncProxiedValues(source?: TSource): boolean };
}

export function useTrackingProxy<TSource, TKeys extends keyof TSource>(
	sourceGetter: () => TSource,
	sourceChanged: Signal,
	keys: readonly TKeys[]
) {
	const forceUpdate = useForceUpdate();
	const proxy = useMemo(() => createTrackingProxy(sourceGetter(), keys), [ keys ]);

	useLayoutEffect(() => subscribe(sourceChanged, () => {
		if (proxy.syncProxiedValues(sourceGetter())) {
			forceUpdate();
		}
	}), [ proxy, sourceChanged ]);

	return proxy;
}
