import { h, RenderableProps } from 'preact';

import { JSAnimation, JSAnimationOptions } from '~/utils/JSAnimation';
import { bem, cx } from '~/utils/style';

import type { SlideshowProvider } from './SlideshowProvider';
import { SlideshowResource } from './SlideshowResource';
import type { ViewportLayout } from './types';

export enum SlideshowDirection {
	Column,
	Row,

	// currently reverse directions do not support docking
	// it seems that with justify-content set to flex-end, overflow no longer
	// works and an additional container is required to allow scrolling
	ColumnReverse,
	RowReverse
}

export enum SlideshowUnit {
	ViewportSize,
	Pixels
}

export interface ViewportProps {
	readonly class?: string;
	readonly direction?: SlideshowDirection;
	readonly units?: SlideshowUnit;
	readonly scrollable?: boolean;
	readonly paddingStart?: number;
	readonly paddingEnd?: number;
	readonly position?: number;
	readonly onPositionChange?: (position: number) => void;
}

export class Viewport extends SlideshowResource<ViewportLayout, ViewportProps> {
	private readonly animation: JSAnimation;

	private wrapper: HTMLElement | null = null;
	private observer: ResizeObserver | null = null;
	private offset = 0;
	private size = 1;

	public get isHorizontal() {
		const { direction } = this.props;
		return (
			direction === SlideshowDirection.Row ||
			direction === SlideshowDirection.RowReverse
		);
	}

	public get unit() {
		switch (this.props.units) {
			case SlideshowUnit.Pixels:
				return 1;

			// case SlideshowUnit.ViewportSize:
			default:
				return this.size;
		}
	}

	public constructor(props: ViewportProps) {
		super(props);
		this.animation = new JSAnimation(offset => this.setOffset(offset, true));
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
		if (prevProps.position !== nextProps.position && nextProps.position !== undefined) {
			this.setOffset(nextProps.position * this.unit * (this.layout?.totalLength ?? 1));
		}

		return (
			prevProps.children !== nextProps.children ||
			prevProps.scrollable !== nextProps.scrollable ||
			prevProps.direction !== nextProps.direction
		);
	}

	public render({
		class: customClass,
		children,
		direction = SlideshowDirection.Column,
		scrollable
	}: RenderableProps<ViewportProps>) {
		return (
			<div
				ref={this.onWrapperRef}
				class={cx(
					bem('slideshow', {
						'scrollable': scrollable,
						'column': direction === SlideshowDirection.Column,
						'column-reverse': direction === SlideshowDirection.ColumnReverse,
						'row': direction === SlideshowDirection.Row,
						'row-reverse': direction === SlideshowDirection.RowReverse
					}),
					customClass
				)}
			>
				<div class='slideshow__expander' />
				{children}
				<div class='slideshow__expander' />
			</div>
		);
	}

	public scrollTo(offset: number, animationOptions?: JSAnimationOptions) {
		this.animation.start({
			...animationOptions,
			valueFrom: this.offset,
			valueTo: offset * this.unit
		});

		return this.animation;
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

		const { classList, style } = this.wrapper;
		style.setProperty('--ss-expand-start', '' + layout.expandStart);
		style.setProperty('--ss-expand-end', '' + layout.expandEnd);
		style.setProperty('--ss-unit', unit);
		classList.toggle('slideshow--docked', layout.isDocked);
	}

	protected onUpdateSlideshow(context: SlideshowProvider | null, props: ViewportProps, isFrame?: boolean) {
		if (context !== this.context) {
			this.context?.unsetViewport(this);
		}

		context?.setViewport(this, {
			offset: this.offset / this.unit,
			size: this.size / this.unit,
			paddingStart: props.paddingStart ?? 0,
			paddingEnd: props.paddingEnd ?? 0
		}, isFrame);
	}

	private setOffset(offset: number, isFrame?: boolean) {
		// round to physical pixels (may result in decimals when pixel ratio is not 1)
		const newOffset = Math.round(offset * devicePixelRatio) / devicePixelRatio;
		if (this.offset === newOffset) {
			return;
		}

		this.offset = Math.round(offset * devicePixelRatio) / devicePixelRatio;

		const { isHorizontal } = this;
		this.wrapper?.scrollTo(
			isHorizontal ? newOffset : 0,
			isHorizontal ? 0 : newOffset
		);

		this.updateSlideshow(isFrame);
	}

	private readonly onWrapperRef = (wrapper: HTMLElement | null) => {
		if (this.wrapper) {
			this.wrapper.removeEventListener('scroll', this.onScroll);
			this.observer!.unobserve(this.wrapper);
		}

		this.wrapper = wrapper;
		if (wrapper) {
			// Because the callback of ResizeObserver may not get fired soon enough, we grab the initial size now.
			this.size = this.isHorizontal ? this.wrapper!.clientWidth : this.wrapper!.clientHeight;

			wrapper.addEventListener('scroll', this.onScroll, { passive: true });
			this.observer ??= new ResizeObserver(this.onResizeObserved);
			this.observer.observe(wrapper);
		}
	};

	private readonly onScroll = () => {
		const newOffset = this.isHorizontal ? this.wrapper!.scrollLeft : this.wrapper!.scrollTop;
		if (this.offset !== newOffset) {
			this.offset = newOffset;
			this.updateSlideshow();
		}

		this.props.onPositionChange?.(newOffset / this.unit / (this.layout?.totalLength ?? 1));
	};

	private readonly onResizeObserved = (entries: readonly ResizeObserverEntry[]) => {
		const entry = entries[0].contentRect;
		const newSize = this.isHorizontal ? entry.width : entry.height;
		const newOffset = newSize * this.offset / this.size;

		this.size = newSize;
		this.setOffset(newOffset);
		this.updateSlideshow();
	};

	public static readonly contextType = SlideshowResource.contextType;
}
