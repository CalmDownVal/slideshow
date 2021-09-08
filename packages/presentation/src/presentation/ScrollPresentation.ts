import { PresentationBase, PresentationBaseProps } from '~/presentation/PresentationBase';
import { JSAnimation, JSAnimationOptions, smootherStep } from '~/utils/animation';
import { UNIT } from '~/utils/constants';

export class ScrollPresentation extends PresentationBase {
	private readonly animation: JSAnimation;
	private isScrollTicking = false;

	public constructor(props: PresentationBaseProps) {
		super(props);
		this.animation = new JSAnimation(
			position => {
				const { isHorizontal } = this;
				this.viewport?.scrollTo(
					isHorizontal ? position : 0,
					isHorizontal ? 0 : position
				);

				this.position = position;
				this.forceUpdate();
			},
			{
				easing: smootherStep
			}
		);
	}

	public scrollTo(offset: number, animationOptions?: JSAnimationOptions) {
		this.animation.start({
			...animationOptions,
			valueFrom: this.position,
			valueTo: offset * this.clientLength / UNIT
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
		if (!this.isScrollTicking && !this.animation.isRunning) {
			requestAnimationFrame(this.onScrollThrottled);
			this.isScrollTicking = true;
		}
	};

	private readonly onScrollThrottled = () => {
		this.isScrollTicking = false;
		if (this.viewport) {
			const nextPosition = this.isHorizontal ? this.viewport.scrollLeft : this.viewport.scrollTop;
			if (this.position !== nextPosition) {
				this.position = nextPosition;
				this.forceUpdate();
			}
		}
	};

	public static readonly defaultProps = PresentationBase.defaultProps;
}
