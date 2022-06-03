export interface Listener<T = void> {
	(event: T): void;
}

export interface Signal<T = void> {
	(...args: (T extends void ? [] : [ event: T ])): void;
	listeners: Listener<T>[];
}

export function createSignal<T = void>(): Signal<T> {
	const listeners: Listener<T>[] = [];
	const signal = function (this: any, event?: T) {
		const { length } = listeners;
		for (let i = 0; i < length; ++i) {
			listeners[i].call(this, event!);
		}
	};

	signal.listeners = [] as Listener<T>[];
	return signal;
}

export function subscribe<T>({ listeners }: Signal<T>, listener: Listener<T>) {
	const insertedAt = listeners.length;
	listeners.push(listener);

	return () => {
		const index = listeners.lastIndexOf(listener, insertedAt);
		listeners.splice(index, 1);
	};
}
