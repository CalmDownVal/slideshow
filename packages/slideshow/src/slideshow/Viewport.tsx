import { h, RenderableProps } from 'preact';

import { bem, bemUpdate } from '~/utils/style';

import type { SlideshowProvider } from './SlideshowProvider';
import { SlideshowResource } from './SlideshowResource';
import type { ViewportLayout } from './types';

export enum SlideshowDirection {
	TopToBottom,
	LeftToRight,

	// currently reverse directions do not support docking
	// it seems that with justify-content set to flex-end, overflow no longer
	// works and an additional container is required to allow scrolling
	BottomToTop,
	RightToLeft
}

export enum SlideshowUnit {
	ViewportSize,
	Pixels
}

export interface ViewportProps {
	readonly direction?: SlideshowDirection;
	readonly units?: SlideshowUnit;
	readonly scrollable?: boolean;
	readonly paddingStart?: number;
	readonly paddingEnd?: number;
}

export class Viewport extends SlideshowResource<ViewportLayout, ViewportProps> {
	private wrapper: HTMLElement | null = null;
	private observer: ResizeObserver | null = null;
	private offset = 0;
	private size = 1;

	public get isHorizontal() {
		const { direction } = this.props;
		return (
			direction === SlideshowDirection.LeftToRight ||
			direction === SlideshowDirection.RightToLeft
		);
	}

	public componentWillUnmount() {
		super.componentWillUnmount();
		this.observer?.disconnect();
		this.observer = null;
	}

	public shouldComponentUpdate(
		nextProps: RenderableProps<ViewportProps>,
		nextState: {},
		nextContext: SlideshowProvider | null
	) {
		if (super.shouldComponentUpdate(nextProps, nextState, nextContext)) {
			return true;
		}

		const prevProps = this.props;
		return (
			prevProps.children !== nextProps.children ||
			prevProps.scrollable !== nextProps.scrollable ||
			prevProps.direction !== nextProps.direction
		);
	}

	public render({
		children,
		direction = SlideshowDirection.TopToBottom,
		scrollable
	}: RenderableProps<ViewportProps>) {
		return (
			<div
				ref={this.onWrapperRef}
				class={bem('slideshow', {
					'scrollable': scrollable,
					'top-to-bottom': direction === SlideshowDirection.TopToBottom,
					'left-to-right': direction === SlideshowDirection.LeftToRight,
					'bottom-to-top': direction === SlideshowDirection.BottomToTop,
					'right-to-left': direction === SlideshowDirection.RightToLeft
				})}
			>
				<div class='slideshow__expander' />
				{children}
				<div class='slideshow__expander' />
			</div>
		);
	}

	protected onUpdateLayout(layout: Readonly<ViewportLayout>) {
		if (!this.wrapper) {
			return;
		}

		let unit;
		switch (this.props.units) {
			case SlideshowUnit.Pixels:
				unit = '1px';
				break;

			// case SlideshowUnit.ViewportSize:
			default:
				unit = '100%';
				break;
		}

		this.wrapper.style.setProperty('--ss-expand-start', '' + layout.expandStart);
		this.wrapper.style.setProperty('--ss-expand-end', '' + layout.expandEnd);
		this.wrapper.style.setProperty('--ss-unit', unit);

		bemUpdate(this.wrapper.classList, 'slideshow', {
			docked: layout.isDocked
		});
	}

	protected onUpdateSlideshow(context: SlideshowProvider | null, props: ViewportProps) {
		if (context !== this.context) {
			this.context?.unsetViewport(this);
		}

		let offset;
		let size;

		switch (this.props.units) {
			case SlideshowUnit.Pixels:
				offset = this.offset;
				size = this.size;
				break;

			// case SlideshowUnit.ViewportSize:
			default:
				offset = this.offset / this.size;
				size = 1;
				break;
		}

		context?.setViewport(this, {
			offset,
			size,
			paddingStart: props.paddingStart ?? 0,
			paddingEnd: props.paddingEnd ?? 0
		});
	}

	private readonly onWrapperRef = (wrapper: HTMLElement | null) => {
		if (this.wrapper) {
			this.wrapper.removeEventListener('scroll', this.onScroll);
			this.observer!.unobserve(this.wrapper);
		}

		this.wrapper = wrapper;
		if (wrapper) {
			// Because the callback of ResizeObserver may not get fired soon enough,
			// we grab the initial size now.
			this.size = this.isHorizontal
				? this.wrapper!.clientWidth
				: this.wrapper!.clientHeight;

			wrapper.addEventListener('scroll', this.onScroll, { passive: true });
			this.observer ??= new ResizeObserver(this.onResizeObserved);
			this.observer.observe(wrapper);
		}
	};

	private readonly onScroll = () => {
		this.offset = this.isHorizontal ? this.wrapper!.scrollLeft : this.wrapper!.scrollTop;
		if (this.props.scrollable) {
			this.updateSlideshow();
		}
	};

	private readonly onResizeObserved = (entries: readonly ResizeObserverEntry[]) => {
		const entry = entries[0].contentRect;
		this.size = this.isHorizontal ? entry.width : entry.height;
		if (this.props.units === SlideshowUnit.Pixels) {
			this.updateSlideshow();
		}
	};

	public static readonly contextType = SlideshowResource.contextType;
}
