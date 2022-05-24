import type { PresentationBase } from '~/presentation/PresentationBase';
import type { JSAnimationOptions } from '~/utils/JSAnimation';
import { clamp } from '~/utils/math';

export interface NavigationSlideInfo<TMeta = any> {
	readonly scrollToOffset: number;
	readonly metadata: TMeta;
}

export class Navigation<TMeta = any> {
	public constructor(
		/** @internal */
		public readonly presentation: PresentationBase,
		public readonly activeIndex: number,
		public readonly slides: readonly NavigationSlideInfo<TMeta>[]
	) {}

	public goTo(slideIndex: number, animationOptions?: JSAnimationOptions) {
		return this.presentation.scrollTo(
			this.slides[clamp(slideIndex, 0, this.slides.length - 1)].scrollToOffset,
			animationOptions
		);
	}
}
