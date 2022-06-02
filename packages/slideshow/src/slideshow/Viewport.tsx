import { h, RenderableProps } from 'preact';

import { bemUpdate } from '~/utils/style';

import type { SlideshowProvider } from './SlideshowProvider';
import { SlideshowResource } from './SlideshowResource';
import type { ViewportLayout } from './types';

import './Viewport.css';

export enum SlideshowDirection {
	TopToBottom,
	LeftToRight,
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
			prevProps.children !== nextProps.children
		);
	}

	public render() {
		return (
			<div class='slideshow' ref={this.onWrapperRef}>
				{this.props.children}
				<div class='slideshow__expander' />
			</div>
		);
	}

	public updateLayout(layout: Readonly<ViewportLayout>) {
		if (!this.wrapper) {
			return;
		}

		const {
			direction = SlideshowDirection.TopToBottom,
			scrollable,
			units
		} = this.props;

		bemUpdate(this.wrapper.classList, 'slideshow', {
			'docked': layout.isDocked,
			'scrollable': scrollable,
			'top-to-bottom': direction === SlideshowDirection.TopToBottom,
			'left-to-right': direction === SlideshowDirection.LeftToRight,
			'bottom-to-top': direction === SlideshowDirection.BottomToTop,
			'right-to-left': direction === SlideshowDirection.RightToLeft
		});

		const multiplier = units === SlideshowUnit.Pixels ? 1 : this.size;
		this.wrapper.style.setProperty('--slideshow-length', px(layout.totalLength * multiplier));
		this.wrapper.style.setProperty('--slideshow-unit', px(multiplier));
	}

	protected updateSlideshow(
		context: SlideshowProvider | null = this.context,
		props: ViewportProps = this.props
	) {
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

		if (this.props.units !== SlideshowUnit.Pixels) {
			this.updateSlideshow();
		}
	};

	public static readonly contextType = SlideshowResource.contextType;
}

function px(length: number) {
	return Math.round(length) + 'px';
}
