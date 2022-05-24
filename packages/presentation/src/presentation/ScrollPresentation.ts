import { JSAnimation, JSAnimationOptions, smootherStep } from '~/utils/JSAnimation';

import { PresentationBase, PresentationBaseProps } from './PresentationBase';
import type { Viewport } from './Viewport';

export class ScrollPresentation extends PresentationBase {
	private readonly animation: JSAnimation;
	private scrollFrame?: number;

	public constructor(props: PresentationBaseProps) {
		super(props);
		this.animation = new JSAnimation(
			position => this.setPosition(position, true),
			{ easing: smootherStep }
		);
	}

	public componentWillUnmount() {
		super.componentWillUnmount();
		if (this.scrollFrame !== undefined) {
			cancelAnimationFrame(this.scrollFrame);
			this.scrollFrame = undefined;
		}
	}

	public scrollTo(offset: number, animationOptions?: JSAnimationOptions) {
		this.animation.start({
			...animationOptions,
			valueFrom: this.presentationPosition,
			valueTo: offset
		});

		return this.animation;
	}

	/** @internal */
	public setViewport(viewport: Viewport | null) {
		const oldRef = this.viewport?.ref;
		const newRef = viewport?.ref;
		if (oldRef !== newRef) {
			oldRef?.removeEventListener('scroll', this.onScroll);
			newRef?.addEventListener('scroll', this.onScroll, { passive: true });
		}

		super.setViewport(viewport);
	}

	private readonly onScroll = () => {
		if (!this.animation.isRunning) {
			this.scrollFrame ??= requestAnimationFrame(this.onScrollThrottled);
		}
	};

	private readonly onScrollThrottled = () => {
		const { isHorizontal, ref } = this.viewport!;
		const position = isHorizontal ? 'scrollLeft' : 'scrollTop';
		const scrollSize = isHorizontal ? 'scrollWidth' : 'scrollHeight';
		const layoutSize = isHorizontal ? 'clientWidth' : 'clientHeight';

		this.setPosition(ref![position] / (ref![scrollSize] - ref![layoutSize]), true);
		this.scrollFrame = undefined;
	};

	public static readonly defaultProps = PresentationBase.defaultProps;
}
