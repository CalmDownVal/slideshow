import { createContext, useContext } from 'react';

import { UNIT } from '~/utils/constants';
import { clamp } from '~/utils/math';
import { Mutable } from '~/utils/types';

export enum ProgressionOffset {
	Appear = 0,
	Main = 1,
	Disappear = 2
}

export class Progression {
	public readonly appear!: number;
	public readonly disappear!: number;
	public readonly dock: number = 0;
	public readonly main!: number;

	/** @internal */
	public readonly value!: number;

	private constructor() {}

	public static animate(animationName: string, value: number) {
		return {
			animationDelay: `-${clamp(value)}s`,
			animationDuration: '1s',
			animationFillMode: 'both',
			animationName,
			animationPlayState: 'paused'
		};
	}

	public static offset(value: number) {
		return {
			animationDelay: `-${clamp(value)}s`
		};
	}

	/** @internal */
	public static create(value: number, dockLength: number, slideLength: number) {
		const instance = new Progression() as Mutable<Progression>;

		instance.appear = clamp(value - ProgressionOffset.Appear);
		instance.disappear = clamp(value - ProgressionOffset.Disappear);
		instance.main = clamp(value - ProgressionOffset.Main);
		instance.value = value;

		if (dockLength > 0) {
			const startOffset = Math.max(UNIT - slideLength, 0);
			const endOffset = Math.max(slideLength - UNIT, 0);

			const dockStart = startOffset / (startOffset + dockLength);
			const dockEnd = 1 - endOffset / (endOffset + dockLength);

			instance.dock = (instance.main - dockStart) / (dockEnd - dockStart);
		}

		return instance;
	}
}

export const ProgressionContext = createContext<Progression | null>(null);

export function useProgression() {
	const progression = useContext(ProgressionContext);
	if (progression === null) {
		throw new Error('useProgression can only be used within child components of a <Slide />');
	}

	return progression;
}
