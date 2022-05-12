import { createContext, Component, h } from 'preact';

import { Navigation, NavigationSlideInfo } from '~/presentation/Navigation';
import { ProgressionOffset } from '~/presentation/Progression';
import type { JSAnimation, JSAnimationOptions } from '~/utils/animation';
import { UNIT } from '~/utils/constants';
import { clamp } from '~/utils/math';
import { mergeSort } from '~/utils/mergeSort';
import { px } from '~/utils/style';
import type { OptionalsOf } from '~/utils/types';

import type { Slide } from './Slide';

export enum Direction {
	TopToBottom,
	LeftToRight
}

export interface PresentationBaseProps {
	readonly clipThreshold?: number;
	readonly direction?: Direction;
	readonly tagName?: string;
}

export const PresentationContext = createContext<Navigation | null>(null);

export abstract class PresentationBase<TProps extends PresentationBaseProps = PresentationBaseProps> extends Component<TProps> {
	protected position = 0;
	protected viewport: HTMLElement | null = null;
	protected clientLength = 0;
	protected scrollLength = 0;

	private expander: HTMLElement | null = null;
	private isResizeTicking = false;
	private isSlidesTicking = false;
	private navigation: Navigation;
	private observer?: ResizeObserver;
	private skipLayout = false;
	private slideOrder = 0;
	private slides: Slide[] = [];

	public constructor(props: TProps) {
		super(props);

		// must be within a constructor, otherwise `this` references Window when using CJS
		this.navigation = new Navigation(this, -1, []);
		this.observer = new ResizeObserver(this.onResize);
	}

	public get isHorizontal() {
		return this.props.direction === Direction.LeftToRight;
	}

	public componentDidMount() {
		this.updateLayout();
	}

	public componentDidUpdate() {
		this.updateLayout();
	}

	public componentWillUnmount() {
		this.observer?.disconnect();
		this.observer = undefined;
	}

	public shouldComponentUpdate(next: TProps) {
		const prev = this.props;
		return (
			next.tagName !== prev.tagName ||
			next.direction !== prev.direction
		);
	}

	public render() {
		return h(PresentationContext.Provider, {
			value: this.navigation,
			children: this.props.children
		});
	}

	public abstract scrollTo(offset: number, animationOptions?: JSAnimationOptions): JSAnimation | void;

	/** @internal */
	public getFallbackOrder() {
		return ++this.slideOrder;
	}

	/** @internal */
	public addSlide(slide: Slide) {
		this.slides.push(slide);
		this.updateSlides();
	}

	/** @internal */
	public removeSlide(slide: Slide) {
		const index = this.slides.indexOf(slide);
		if (index !== -1) {
			this.slides.splice(index, 1);
			this.updateSlides();
		}
	}

	/** @internal */
	public setViewport(viewport: HTMLElement | null) {
		if (this.viewport) {
			this.observer?.disconnect();
		}

		this.viewport = viewport;
		if (viewport) {
			// fires onResize automatically
			this.observer?.observe(viewport);
		}
	}

	/** @internal */
	public setExpander(expander: HTMLElement | null) {
		this.expander = expander;
	}

	private updateLayout() {
		if (this.clientLength === 0 || this.skipLayout) {
			this.skipLayout = false;
			return;
		}

		const { expander, isHorizontal, slides } = this;
		const { clipThreshold } = this.props;
		const axisPosition = isHorizontal ? 'left' : 'top';
		const axisLength = isHorizontal ? 'width' : 'height';

		// 1st pass: calculate slide layouts
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
				position: offsetDockLower + offsetLength,
				scrollToOffset: offsetDockLower + offsetDockUpper + offsetLength,
				visibilityScore: 0
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

		// 2nd pass: solve progression and dispatch state changes
		const navSlides = new Array<NavigationSlideInfo>(layouts.length);
		let activeSlideIndex = 0;
		let bestVisibilityScore = 0;

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

			navSlides[i] = {
				metadata: layout.slide.props.metadata,
				scrollToOffset: layout.scrollToOffset
			};

			if (layout.visibilityScore > bestVisibilityScore) {
				activeSlideIndex = i;
				bestVisibilityScore = layout.visibilityScore;
			}
		}

		// Update navigation if necessary (requires re-render to update context)
		if (activeSlideIndex !== this.navigation.activeIndex) {
			this.navigation = new Navigation(this, activeSlideIndex, navSlides);
			this.skipLayout = true;
			this.forceUpdate();
		}
	}

	private updateSlides() {
		if (!this.isSlidesTicking) {
			requestAnimationFrame(this.onUpdateSlidesThrottled);
			this.isSlidesTicking = true;
		}
	}

	private readonly onUpdateSlidesThrottled = () => {
		this.isSlidesTicking = false;
		this.slides = mergeSort(this.slides, byOrderAsc);
		this.forceUpdate();
	};

	private readonly onResize = () => {
		if (!this.isResizeTicking) {
			requestAnimationFrame(this.onResizeThrottled);
			this.isResizeTicking = true;
		}
	};

	private readonly onResizeThrottled = () => {
		this.isResizeTicking = false;

		const { isHorizontal, viewport } = this;
		if (viewport) {
			const nextClientLength = isHorizontal ? viewport.clientWidth : viewport.clientHeight;
			const nextScrollLength = isHorizontal ? viewport.scrollWidth : viewport.scrollHeight;
			if (this.clientLength !== nextClientLength || this.scrollLength !== nextScrollLength) {
				this.clientLength = nextClientLength;
				this.scrollLength = nextScrollLength;
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

interface SlideLayout {
	readonly slide: Slide;
	isClipped: boolean;
	isDocked: boolean;
	isVisible: boolean;
	position: number;
	scrollToOffset: number;
	visibilityScore: number;
}

function solveProgression(layout: SlideLayout, position: number, dockShift: number) {
	const { dock, length } = layout.slide.props;

	const maxLength = Math.min(length!, UNIT);
	const visibleLength = clamp(
		layout.isDocked && layout.position > dockShift
			? UNIT - layout.position + dockShift
			: layout.position > position
				? position + UNIT - layout.position
				: layout.position + length! + (layout.isDocked ? dock! : 0) - position,
		0,
		maxLength
	);

	layout.visibilityScore = visibleLength / maxLength;
	if (visibleLength < maxLength) {
		return layout.position + dockShift > position
			? ProgressionOffset.Appear + layout.visibilityScore
			: ProgressionOffset.Disappear + 1 - layout.visibilityScore;
	}

	const totalScrollLength = Math.abs(UNIT - length!) + dock!;
	if (totalScrollLength === 0) {
		return ProgressionOffset.Disappear;
	}

	const mainStart = layout.isDocked && layout.position > dockShift
		? position - dockShift + (layout.position - Math.max(UNIT - maxLength, 0))
		: layout.position - Math.max(UNIT - maxLength, 0);

	return ProgressionOffset.Main + Math.max(position - mainStart, 0) / totalScrollLength;
}

function byOrderAsc(a: Slide, b: Slide) {
	return a.order - b.order;
}
