export function apply<T extends Record<string, any>>(current: T, incoming: T) {
	let didChange = false;
	for (const key in incoming) {
		if (current[key] !== incoming[key]) {
			current[key] = incoming[key];
			didChange = true;
		}
	}

	return didChange;
}
