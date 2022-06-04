import { useContext } from 'preact/hooks';

import { SlideshowContext } from '~/slideshow/SlideshowProvider';
import type { SlideInfo } from '~/slideshow/types';
import type { JSAnimation, JSAnimationOptions } from '~/utils/JSAnimation';

import { useTrackingProxy } from './useTrackingProxy';

export interface Navigation<TMetadata = any> {
	readonly activeIndex: number;
	readonly slides: readonly SlideInfo<TMetadata>[];
	goTo(index: number, animation?: JSAnimationOptions): JSAnimation | undefined;
}

const keys = [ 'activeIndex', 'slides', 'goTo' ] as const;

export function useNavigation<TMetadata = any>(): Navigation<TMetadata> {
	const provider = useContext(SlideshowContext);
	const navigation = useTrackingProxy(
		provider,
		provider?.navigationChanged,
		keys
	);

	return navigation!;
}
