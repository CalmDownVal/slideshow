import { createElement, HTMLAttributes, PureComponent, RefAttributes } from 'react';

import { Navigation, NavigationContext } from '~/context/useNavigation';
import { SlidePhase } from '~/context/useProgression';
import { UNIT } from '~/utils/constants';
import { createFilter, filterProps } from '~/utils/filterProps';
import { mergeSort } from '~/utils/mergeSort';
import { bem, cx, px } from '~/utils/style';
import type { OptionalsOf } from '~/utils/types';

import type { Slide } from './Slide';

export enum Direction {
	TopToBottom,
	LeftToRight
}

export interface PresentationBaseProps extends HTMLAttributes<HTMLElement> {
	readonly clipThreshold?: number;
	readonly direction?: Direction;
	readonly tagName?: string;
}

interface SlideLayout {
	readonly slide: Slide;
	isClipped: boolean;
	isDocked: boolean;
	isVisible: boolean;
	offset: number;
}

const OWN_PROPS = createFilter<keyof PresentationBaseProps>([
	'children',
	'clipThreshold',
	'direction',
	'tagName'
]);

function byOrderAsc(a: Slide, b: Slide) {
	return a.order - b.order;
}

export abstract class PresentationBase<TProps extends PresentationBaseProps = PresentationBaseProps> extends PureComponent<TProps> {
	protected position = 0;
	protected wrapper: HTMLElement | null = null;
	protected clientLength = 0;
	protected scrollLength = 0;

	private expander: HTMLElement | null = null;
	private isResizeTicking = false;
	private navigation: Navigation;
	private observer?: ResizeObserver;
	private slideOrder = 0;
	private slides: Slide[] = [];
	private slidesDirty = false;

	public constructor(props: TProps) {
		super(props);

		// must be within a constructor, otherwise `this` references Window when using CJS
		this.navigation = new Navigation(this);
	}

	public componentDidMount() {
		if (typeof ResizeObserver === 'function') {
			this.observer = new ResizeObserver(this.onResize);
		}
		else {
			window.addEventListener('resize', this.onResize, { passive: true });
		}

		this.updateSlideLayout();
	}

	public componentDidUpdate() {
		this.updateSlideLayout();
	}

	public componentWillUnmount() {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = undefined;
		}
		else {
			window.removeEventListener('resize', this.onResize);
		}
	}

	public render() {
		const { isHorizontal } = this;
		const props = filterProps<PresentationBaseProps & RefAttributes<HTMLDivElement>>(this.props, OWN_PROPS);
		props.ref = this.onWrapperRefStable;
		props.className = cx(
			bem('cdv-presentation', {
				horizontal: isHorizontal,
				vertical: !isHorizontal
			}),
			this.props.className
		);

		return createElement(
			this.props.tagName as 'div',
			props,
			createElement(
				NavigationContext.Provider,
				{ value: this.navigation },
				this.props.children,
				createElement('div', {
					className: 'cdv-presentation__expander',
					ref: this.onExpanderRefStable
				})
			)
		);
	}

	/** @internal */
	public getFallbackOrder() {
		return ++this.slideOrder;
	}

	/** @internal */
	public register(slide: Slide) {
		this.slides.push(slide);
		this.slidesDirty = true;
	}

	/** @internal */
	public unregister(slide: Slide) {
		const index = this.slides.indexOf(slide);
		if (index !== -1) {
			this.slides.splice(index, 1);
			this.slidesDirty = true;
		}
	}

	protected get isHorizontal() {
		return this.props.direction === Direction.LeftToRight;
	}

	protected onWrapperRef(wrapper: HTMLElement | null) {
		if (this.wrapper) {
			if (this.observer) {
				this.observer.unobserve(this.wrapper);
			}
		}

		this.wrapper = wrapper;
		if (wrapper) {
			if (this.observer) {
				// fires onResize automatically
				this.observer.observe(wrapper);
			}
			else {
				this.onResize();
			}
		}
	}

	private updateSlideLayout() {
		if (this.clientLength === 0) {
			return;
		}

		if (this.slidesDirty) {
			this.slides = mergeSort(this.slides, byOrderAsc);
			this.slidesDirty = false;
		}

		const { expander, isHorizontal, slides } = this;
		const { clipThreshold } = this.props;
		const axisPosition = isHorizontal ? 'left' : 'top';
		const axisLength = isHorizontal ? 'width' : 'height';

		// pass 1: prepare slide layouts
		const layouts = new Array<SlideLayout>(slides.length);
		const ratio = this.clientLength / UNIT;
		const position = this.position / ratio;

		let offset = 0;
		for (let slide, totalLength, clipBoundary, i = 0; i < layouts.length; ++i) {
			slide = slides[i];
			totalLength = slide.props.length! + slide.props.dock!;
			clipBoundary = Math.max(
				offset - (position + UNIT),
				position - (offset + totalLength)
			);

			layouts[i] = {
				isClipped: clipBoundary >= clipThreshold!,
				isDocked: false,
				isVisible: clipBoundary < 0,
				offset,
				slide
			};

			offset += totalLength;
		}

		// We now know the total length of our slides.
		// Adjust the expander to always preserve the correct scrollLength
		if (expander) {
			expander.style[axisLength] = '1px';
			expander.style[axisPosition] = px(offset * ratio - 1);
		}

		// pass 2: find visible slides and adjust layouts for docking
		for (let layout, i = 0; i < layouts.length; ++i) {
			layout = layouts[i];
			if (!layout.isVisible) {
				continue;
			}

			const dock = layout.slide.props.dock!;
			if (dock > 0) {
				const overlap = position - layout.offset;
				layout.isDocked = overlap >= 0 && overlap <= dock;

				if (layout.isDocked) {
					let dockOffset = 0;
					while (dockOffset < UNIT && i < layouts.length) {
						layout.isClipped = false;
						layout.isDocked = true;
						layout.isVisible = true;
						layout.offset = dockOffset;

						dockOffset += layout.slide.props.length!;
						layout = layouts[++i];
					}

					break;
				}
				else if (overlap > dock) {
					layout.offset += dock;
				}
				else {
					const dockVisibilityThreshold = position + UNIT;
					const dockClippingThreshold = UNIT + clipThreshold! - overlap - layout.slide.props.length!;
					let dockOffset = 0;
					let y = i;

					while (dockOffset < dockClippingThreshold && ++y < layouts.length) {
						layout = layouts[y];
						layout.offset -= dock;
						layout.isClipped = false;
						layout.isVisible = layout.offset < dockVisibilityThreshold;

						dockOffset += layout.slide.props.length!;
					}
				}
			}
		}

		// pass 3: solve progression and dispatch state changes
		for (let layout, i = 0; i < layouts.length; ++i) {
			layout = layouts[i];
			layout.slide.setState({
				isClipped: layout.isClipped,
				isDocked: layout.isDocked,
				isVisible: layout.isVisible,
				layout: {
					[axisPosition]: px(layout.offset * ratio),
					[axisLength]: px(layout.slide.props.length! * ratio)
				},
				progression: 0 // TODO
			});
		}
	}

	private readonly onWrapperRefStable = (wrapper: HTMLElement | null) => this.onWrapperRef(wrapper);

	private readonly onExpanderRefStable = (expander: HTMLElement | null) => {
		this.expander = expander;
	};

	private readonly onResize = () => {
		if (!this.isResizeTicking) {
			requestAnimationFrame(this.onResizeThrottled);
			this.isResizeTicking = true;
		}
	};

	private readonly onResizeThrottled = () => {
		this.isResizeTicking = false;

		const { isHorizontal, wrapper } = this;
		if (wrapper) {
			const nextClientLength = isHorizontal ? wrapper.clientWidth : wrapper.clientHeight;
			const nextScrollLength = isHorizontal ? wrapper.scrollWidth : wrapper.scrollHeight;
			if (this.clientLength !== nextClientLength || this.scrollLength !== nextScrollLength) {
				this.clientLength = nextClientLength;
				this.clientLength = nextScrollLength;
				this.forceUpdate();
			}
		}
	};

	public static readonly defaultProps: OptionalsOf<PresentationBaseProps> = {
		clipThreshold: UNIT * 2 / 3,
		direction: Direction.TopToBottom,
		tagName: 'div'
	};
}
