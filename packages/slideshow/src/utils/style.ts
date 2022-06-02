export interface BemModifiers {
	[name: string]: boolean | null | undefined;
}

export function bem(componentName: string, modifiers: BemModifiers) {
	let classNames = componentName;
	for (const modifier in modifiers) {
		if (modifiers[modifier]) {
			classNames += ` ${componentName}--${modifier}`;
		}
	}

	return classNames;
}

export function cx(...classNames: (string | null | undefined)[]): string;
export function cx() {
	const { length } = arguments;

	let classNames = '';
	for (let arg, i = 0; i < length; ++i) {
		if ((arg = arguments[i])) {
			classNames += (classNames && ' ') + arg;
		}
	}

	return classNames;
}
