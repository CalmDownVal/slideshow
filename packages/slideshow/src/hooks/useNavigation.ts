import { useContext } from 'preact/hooks';

import { SlideshowContext } from '~/slideshow/SlideshowProvider';
import type { SlideInfo } from '~/slideshow/types';

import { useTrackingProxy } from './useTrackingProxy';

export interface Navigation<TMetadata = any> {
	readonly activeIndex: number;
	readonly slides: readonly SlideInfo<TMetadata>[];
	// goTo(index: number, animation?: JSAnimationOptions): void;
}

const keys = [ 'activeIndex', 'slides' ] as const;

export function useNavigation<TMetadata = any>(): Navigation<TMetadata> {
	const provider = useContext(SlideshowContext);
	const navigation = useTrackingProxy(
		provider,
		provider?.navigationChanged,
		keys
	);

	return navigation!;
}
