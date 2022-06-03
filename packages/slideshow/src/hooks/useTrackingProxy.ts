import { useLayoutEffect, useMemo } from 'preact/hooks';

import { Signal, subscribe } from '~/utils/Signal';

import { useForceUpdate } from './useForceUpdate';

function createTrackingProxy<TSource, TKeys extends keyof TSource>(source: TSource, keys: readonly TKeys[]) {
	const accessMap: Record<keyof any, boolean | undefined> = {};
	const copiedValues: Record<keyof any, any> = {};

	const proxy = {
		syncProxiedValues() {
			let hasTrackedChanges = false;
			for (let key: keyof TSource, value, i = 0; i < keys.length; ++i) {
				key = keys[i];
				value = source[key];
				hasTrackedChanges ||= accessMap[key] && copiedValues[key] !== value;
				copiedValues[key] = value;
				accessMap[key] = false;
			}

			return hasTrackedChanges;
		}
	};

	for (let key: keyof TSource, i = 0; i < keys.length; ++i) {
		key = keys[i];
		copiedValues[key] = source[key];
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
	const proxy = useMemo(() => source && createTrackingProxy(source, keys), [ source ]);

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
