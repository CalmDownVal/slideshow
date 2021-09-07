import { PresentationBase } from './PresentationBase';

export class ScrollPresentation extends PresentationBase {
	private isScrollTicking = false;

	protected onWrapperRef(wrapper: HTMLElement | null) {
		this.wrapper?.removeEventListener('scroll', this.onScroll);
		super.onWrapperRef(wrapper);
		wrapper?.addEventListener('scroll', this.onScroll, { passive: true });
	}

	private readonly onScroll = () => {
		if (!this.isScrollTicking) {
			requestAnimationFrame(this.onScrollThrottled);
			this.isScrollTicking = true;
		}
	};

	private readonly onScrollThrottled = () => {
		this.isScrollTicking = false;
		if (this.wrapper) {
			const nextPosition = this.isHorizontal ? this.wrapper.scrollLeft : this.wrapper.scrollTop;
			if (this.position !== nextPosition) {
				this.position = nextPosition;
				this.forceUpdate();
			}
		}
	};

	public static readonly defaultProps = PresentationBase.defaultProps;
}
