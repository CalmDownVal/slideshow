import { useContext } from 'preact/hooks';

import { SlideContext } from '~/slideshow/Slide';

import { useTrackingProxy } from './useTrackingProxy';

export interface Progression {
	readonly appear: number;
	readonly main: number;
	readonly dock: number;
	readonly disappear: number;
}

const keys = [ 'appear', 'main', 'dock', 'disappear' ] as const;

export function useProgression(): Progression {
	const slide = useContext(SlideContext);
	const progression = useTrackingProxy(
		slide?.progression,
		slide?.progressionChanged,
		keys
	);

	return progression!;
}
