export interface Compare<T> {
	(a: T, b: T): number;
}

function msMerge<T>(part0: readonly T[], part1: readonly T[], compare: Compare<T>) {
	const length0 = part0.length;
	const length1 = part1.length;
	const result = new Array<T>(length0 + length1);

	let index0 = 0;
	let index1 = 0;
	let i = 0;
	let a: T;
	let b: T;

	while (index0 < length0 && index1 < length1) {
		a = part0[index0];
		b = part1[index1];

		if (compare(a, b) <= 0) {
			result[i] = a;
			++index0;
		}
		else {
			result[i] = b;
			++index1;
		}

		++i;
	}

	while (index0 < length0) {
		result[i++] = part0[index0++];
	}

	while (index1 < length1) {
		result[i++] = part1[index1++];
	}

	return result;
}

function msSort<T>(array: readonly T[], compare: Compare<T>, left: number, right: number): T[] {
	if (left >= right) {
		return [ array[left] ];
	}

	const midpoint = (left + right) >>> 1;
	const part0 = msSort(array, compare, left, midpoint);
	const part1 = msSort(array, compare, midpoint + 1, right);

	return msMerge(part0, part1, compare);
}

export function mergeSort<T>(array: readonly T[], compare: Compare<T>) {
	const { length } = array;
	if (length < 2) {
		return array.slice();
	}

	return msSort(array, compare, 0, length - 1);
}
