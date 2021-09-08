export function average(val0: number, ...valN: number[]): number;
export function average() {
	const { length } = arguments;
	let sum = 0;

	for (let i = 0; i < length; ++i) {
		sum += arguments[i];
	}

	return sum / length;
}

export function clamp(value: number, min = 0.0, max = 1.0) {
	return value < min ? min : value > max ? max : value;
}
