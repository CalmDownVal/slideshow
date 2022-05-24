import { PresentationBase, PresentationBaseProps } from '~/presentation/PresentationBase';
import { JSAnimation, JSAnimationOptions, smootherStep } from '~/utils/JSAnimation';

export class ScrollPresentation extends PresentationBase {
	private readonly animation: JSAnimation;

	public constructor(props: PresentationBaseProps) {
		super(props);
		this.animation = new JSAnimation(
			position => this.setPosition(position, true),
			{ easing: smootherStep }
		);
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
	public setViewport(viewport: HTMLElement | null) {
		this.viewport?.removeEventListener('scroll', this.onScroll);
		super.setViewport(viewport);
		viewport?.addEventListener('scroll', this.onScroll, { passive: true });
	}

	private readonly onScroll = () => {
		if (!this.animation.isRunning) {
			this.setPosition(this.isHorizontal
				? this.viewport!.scrollLeft
				: this.viewport!.scrollTop);
		}
	};

	public static readonly defaultProps = PresentationBase.defaultProps;
}
