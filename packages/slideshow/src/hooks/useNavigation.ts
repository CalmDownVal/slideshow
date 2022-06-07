import { useContext } from 'preact/hooks';

import { SlideshowContext } from '~/slideshow/SlideshowProvider';
import { Navigation } from '~/slideshow/types';

import { useTrackingProxy } from './useTrackingProxy';

const keys = [ 'activeIndex', 'slides', 'goTo' ] as const;

export function useNavigation<TMeta = any>(): Navigation<TMeta> {
	const provider = useContext(SlideshowContext)!;
	const navigation = useTrackingProxy(
		() => provider,
		provider.navigationChanged,
		keys
	);

	return navigation;
}
