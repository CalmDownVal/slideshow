import { createContext, useContext, useMemo } from 'react';

import { EMPTY } from '~/utils/constants';

export enum SlidePhase {
	/**
	 * When the slide enters the screen
	 */
	FirstAppeared = 0,

	/**
	 * When the maximum visible area of the slide is first reached for regular
	 * Slides or when docking starts for Slides with dock set to > 0.
	 */
	PeakStart = 1,

	/**
	 * When the maximum visible area of the slide is last reached for regular
	 * Slides or when docking ends for Slides with dock set to > 0.
	 */
	PeakEnd = 2,

	/**
	 * When the slide exists the screen
	 */
	LastAppeared = 3
}

export class Progression {
	/** @internal */
	public rawValue = 0;

	private constructor() {}

	public readonly toSimpleStyle = (start = SlidePhase.FirstAppeared, end = SlidePhase.LastAppeared) => ({
		animationDelay: `-${this.toValue(start, end)}s`
	});

	public readonly toStyle = (animationName: string, start = SlidePhase.FirstAppeared, end = SlidePhase.LastAppeared) => ({
		animationDelay: `-${this.toValue(start, end)}s`,
		animationDuration: '1s',
		animationFillMode: 'both',
		animationName,
		animationPlayState: 'paused'
	});

	public readonly toValue = (start = SlidePhase.FirstAppeared, end = SlidePhase.LastAppeared) => {
		const scale = end - start;
		return Math.abs(scale) > Number.EPSILON
			? Math.min(Math.max((this.rawValue - start) / scale, 0), 1)
			: 0;
	};

	public static readonly init = () => new Progression();
}

export const ProgressionContext = createContext<number | null>(null);

export function useProgression() {
	const wrapper = useMemo(Progression.init, EMPTY);
	const rawValue = useContext(ProgressionContext);
	if (rawValue === null) {
		throw new Error('useProgression can only be used within child components of a <Slide />');
	}

	wrapper.rawValue = rawValue;
	return wrapper;
}
