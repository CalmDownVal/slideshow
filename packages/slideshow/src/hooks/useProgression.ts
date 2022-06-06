import { useContext } from 'preact/hooks';

import { SlideContext } from '~/slideshow/Slide';
import type { Progression } from '~/slideshow/types';

import { useTrackingProxy } from './useTrackingProxy';

const keys = [ 'main', 'dock', 'enter', 'leave' ] as const;
const fallback: Progression = {
	main: 0,
	dock: 0,
	enter: 0,
	leave: 0
};

export function useProgression(): Progression {
	const slide = useContext(SlideContext)!;
	const progression = useTrackingProxy(
		() => slide.layout?.progression ?? fallback,
		slide.progressionChanged,
		keys
	);

	return progression;
}
