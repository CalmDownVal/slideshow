import { createElement, HTMLAttributes, PureComponent, ReactNode, RefAttributes } from 'react';

import { Navigation, NavigationContext } from '~/context/useNavigation';
import { ProgressionOffset } from '~/context/useProgression';
import { UNIT } from '~/utils/constants';
import { createFilter, filterProps } from '~/utils/filterProps';
import { clamp } from '~/utils/math';
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
	position: number;
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

function solveProgression(layout: SlideLayout, position: number, dockShift: number) {
	/*
	const { dock, length } = layout.slide.props;

	const maxLength = Math.min(length!, UNIT);
	const visibleLength = clamp(
		layout.isDocked
			? UNIT - layout.dockOffset
			: layout.offset < position
				? layout.offset + length! - position
				: position + UNIT - layout.offset,
		0,
		maxLength
	);

	if (visibleLength < maxLength) {
		return layout.offset > position
			? ProgressionOffset.Appear + visibleLength / maxLength
			: ProgressionOffset.Disappear - visibleLength / maxLength + 1;
	}

	const totalScrollLength = Math.abs(UNIT - length!) + dock!;
	const mainStartBase = layout.offset - (maxLength < UNIT ? UNIT - maxLength : 0);

	const mainStart = layout.isDocked && layout.dockOffset > 0
		? position - (UNIT - mainStartBase + layout.offsetLength)
		: mainStartBase;

	if (layout.slide.order === 3) {
		console.log(UNIT - mainStartBase, layout.offset - layout.dockOffset, maxLength);
	}

	return ProgressionOffset.Main + Math.max(position - mainStart, 0) / totalScrollLength;
	*/
	return 0;
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

	public render(): ReactNode {
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

		let offsetDockLower = 0;
		let offsetDockUpper = 0;
		let offsetLength = 0;
		let dockShift = 0;

		for (let foundVisible = false, isDocked = false, i = 0; i < layouts.length; ++i) {
			const slide = slides[i];
			const { dock, length } = slide.props;
			const clipBoundary = Math.max(
				offsetDockLower + offsetLength - (position + UNIT),
				position - (offsetDockLower + dock! + offsetLength + length!)
			);

			const isVisible = clipBoundary < 0;
			const layout: SlideLayout = {
				isClipped: clipBoundary >= (isDocked ? 0 : clipThreshold!),
				isDocked,
				isVisible,
				slide,
				position: offsetDockLower + offsetLength
			};

			if (isVisible && !isDocked && dock! > 0) {
				const overlap = position - offsetDockLower - offsetLength;
				if (overlap > dock!) {
					layout.position += dock!;
				}
				else if (overlap >= 0) {
					layout.isDocked = true;
					foundVisible = true;
					isDocked = true;
					dockShift = layout.position;
				}
			}

			if (foundVisible) {
				offsetDockUpper += dock!;
			}
			else {
				offsetDockLower += dock!;
			}

			foundVisible ||= isVisible;
			offsetLength += length!;
			layouts[i] = layout;
		}

		// We now know the total length of our slides.
		// Adjust the expander to always preserve the correct scrollLength
		if (expander) {
			expander.style[axisLength] = '1px';
			expander.style[axisPosition] = px((offsetDockLower + offsetDockUpper + offsetLength) * ratio - 1);
		}

		// pass 2: solve progression and dispatch state changes
		for (let layout, i = 0; i < layouts.length; ++i) {
			layout = layouts[i];
			layout.slide.setState({
				isClipped: layout.isClipped,
				isDocked: layout.isDocked,
				isVisible: layout.isVisible,
				layout: {
					[axisPosition]: px((layout.position - dockShift) * ratio),
					[axisLength]: px(layout.slide.props.length! * ratio)
				},
				progressionValue: solveProgression(layout, position, dockShift)
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
		clipThreshold: UNIT / 3,
		direction: Direction.TopToBottom,
		tagName: 'div'
	};
}
