import { Component, createContext, h, RenderableProps } from 'preact';

import { mergeSort } from '~/utils/mergeSort';

import type { LayoutComponent, SlideConfig, SlideLayout, ViewportConfig, ViewportLayout } from './types';

export const SlideshowContext = createContext<SlideshowProvider | null>(null);

export class SlideshowProvider extends Component {
	public slides: SlideInfo[] = [];

	private readonly slideMap = new Map<LayoutComponent<SlideLayout>, SlideInfo>();

	private slidesDirty = false;
	private viewport: ViewportInfo | null = null;
	private frame?: number;

	public shouldComponentUpdate(nextProps: RenderableProps<{}>) {
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
				metadata: null,
				order: 0
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

		// Pass 1: find the top slide and slide measurements
		// ---

		let totalDockAndLength = 0;
		let topLength = 0;
		let i = 0;

		do {
			totalDockAndLength += slides[i].dock + slides[i].length;
			if (totalDockAndLength >= viewport.offset) {
				break;
			}

			topLength += slides[i].length;
		}
		while (++i < count);

		const topSlideOffset = totalDockAndLength - slides[i].length - viewport.offset;
		const isDocked = topSlideOffset > 0;

		while (++i < count) {
			totalDockAndLength += slides[i].dock + slides[i].length;
		}

		// Pass 2: dispatch layout calls
		// ---

		const offset = viewport.paddingStart + (isDocked ? 0 : viewport.offset + topSlideOffset) - topLength;

		let position = 0;
		let bestScore = 0;
		let bestSlide = null;

		for (i = 0; i < count; ++i) {
			const slide = slides[i];
			const score = (
				Math.min(viewport.size, position + slide.length) -
				Math.max(0, position)
			) / slide.length;

			if (score > bestScore) {
				bestScore = score;
				bestSlide = slide;
			}

			slide.component.updateLayout({
				...slide,
				canUnmount: false, // TODO
				isVisible: score > 0,
				position: offset + position
			});

			position += slide.length;
		}

		viewport.component.updateLayout({
			...viewport,
			isDocked,
			totalLength: viewport.paddingStart + totalDockAndLength + viewport.paddingEnd
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

function apply<T>(current: T, incoming: T) {
	let didChange = false;
	for (const key in incoming) {
		if (current[key] !== incoming[key]) {
			current[key] = incoming[key];
			didChange = true;
		}
	}

	return didChange;
}
