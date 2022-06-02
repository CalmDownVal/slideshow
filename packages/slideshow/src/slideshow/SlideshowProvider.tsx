import { Component, createContext, h, RenderableProps } from 'preact';

import { mergeSort } from '~/utils/mergeSort';

import type { LayoutComponent, SlideConfig, SlideLayout, ViewportConfig, ViewportLayout } from './types';

export interface SlideshowProviderProps {
	readonly unmountThreshold?: number;
	readonly remountThreshold?: number;
}

export const SlideshowContext = createContext<SlideshowProvider | null>(null);

export class SlideshowProvider extends Component<SlideshowProviderProps> {
	public slides: SlideInfo[] = [];

	private readonly slideMap = new Map<LayoutComponent<SlideLayout>, SlideInfo>();

	private slidesDirty = false;
	private viewport: ViewportInfo | null = null;
	private frame?: number;

	public shouldComponentUpdate(nextProps: RenderableProps<SlideshowProviderProps>) {
		return this.props.children !== nextProps.children;
	}

	public render() {
		return (
			<SlideshowContext.Provider value={this}>
				{this.props.children}
			</SlideshowContext.Provider>
		);
	}

	public setSlide(slide: LayoutComponent<SlideLayout>, config: SlideConfig, isFrame?: boolean) {
		let info = this.slideMap.get(slide);
		if (!info) {
			info = {
				component: slide,
				dock: 0,
				length: 1,
				order: 0,
				isMounted: true
			};

			this.slideMap.set(slide, info);
			this.slides.push(info);
			this.slidesDirty = true;
		}

		if (apply(info, config)) {
			this.update(isFrame);
		}
	}

	public unsetSlide(slide: LayoutComponent<SlideLayout>) {
		if (this.slideMap.delete(slide)) {
			const index = this.slides.findIndex(info => info.component === slide);
			this.slides.splice(index, 1);
			this.update();
		}
	}

	public setViewport(viewport: LayoutComponent<ViewportLayout>, config: ViewportConfig, isFrame?: boolean) {
		if (this.viewport?.component !== viewport) {
			this.viewport = {
				component: viewport,
				offset: 0,
				size: 1,
				paddingStart: 0,
				paddingEnd: 0
			};
		}

		if (apply(this.viewport, config)) {
			this.update(isFrame);
		}
	}

	public unsetViewport(viewport: LayoutComponent<ViewportLayout>) {
		if (this.viewport?.component === viewport) {
			this.viewport = null;
		}
	}

	private update(isFrame = false) {
		if (isFrame) {
			if (this.frame !== undefined) {
				cancelAnimationFrame(this.frame);
				this.frame = undefined;
			}

			this.solveLayouts();
		}
		else {
			this.frame ??= requestAnimationFrame(this.solveLayouts);
		}
	}

	private readonly solveLayouts = () => {
		this.frame = undefined;
		if (!this.viewport || this.slides.length === 0) {
			return;
		}

		if (this.slidesDirty) {
			this.slides = mergeSort(this.slides, byOrderAsc);
			this.slidesDirty = false;
		}

		const { slides, viewport } = this;
		const count = slides.length;

		// Pass 1: get the total slide dock and length sum
		// ---

		let totalDockAndLength = 0;
		for (let i = 0; i < count; ++i) {
			totalDockAndLength += slides[i].dock + slides[i].length;
		}

		// Pass 2: find the top slide
		// ---

		const totalPadding = viewport.paddingStart + viewport.paddingEnd;
		const offset = Math.min(totalDockAndLength + totalPadding, Math.abs(viewport.offset));

		let lengthStart = 0;
		let dockStart = 0;
		let dockEnd = 0;
		let isDocked = false;

		for (let i = 0; i < count; ++i) {
			const { dock, length } = slides[i];
			if (dockStart + lengthStart + dock + length >= offset) {
				isDocked = dockStart + lengthStart + dock >= offset;
				if (!isDocked) {
					dockStart += dock;
					++i;
				}

				while (i < count) {
					dockEnd += slides[i++].dock;
				}

				break;
			}

			dockStart += dock;
			lengthStart += length;
		}

		// Pass 3: dispatch layout calls
		// ---

		const positionOffset = viewport.paddingStart - lengthStart;
		const visibilityOffset = viewport.paddingStart - (isDocked ? lengthStart : offset - dockStart);
		const {
			unmountThreshold = 1.5,
			remountThreshold = 0.5
		} = this.props;

		let position = 0;
		let bestScore = 0;
		let bestSlide = null;

		for (let i = 0; i < count; ++i) {
			const slide = slides[i];
			const visibleLength =
				Math.min(viewport.size, visibilityOffset + position + slide.length) -
				Math.max(0, visibilityOffset + position);

			// clamping to ≤1 avoids float rounding errors
			const score = Math.min(visibleLength / slide.length, 1);
			if (score > bestScore) {
				bestScore = score;
				bestSlide = slide;
			}

			slide.component.updateLayout({
				...slide,
				position: positionOffset + position,
				isInvisible: visibleLength <= 0,
				canUnmount: -visibleLength / viewport.size >= (slide.isMounted ? unmountThreshold : remountThreshold)
			});

			position += slide.length;
		}

		viewport.component.updateLayout({
			...viewport,
			isDocked,
			expandStart: dockStart + viewport.paddingStart,
			expandEnd: dockEnd + viewport.paddingEnd
		});
	};
}

interface SlideInfo extends Readonly<SlideConfig> {
	readonly component: LayoutComponent<SlideLayout>;
}

interface ViewportInfo extends Readonly<ViewportConfig> {
	readonly component: LayoutComponent<ViewportLayout>;
}

function byOrderAsc(a: SlideInfo, b: SlideInfo) {
	return a.order - b.order;
}

function apply<T extends Record<string, any>>(current: T, incoming: T) {
	let didChange = false;
	for (const key in incoming) {
		if (current[key] !== incoming[key]) {
			current[key] = incoming[key];
			didChange = true;
		}
	}

	return didChange;
}
