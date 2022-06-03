import { Component, createContext, h, RenderableProps } from 'preact';

import { mergeSort } from '~/utils/mergeSort';
import { createSignal } from '~/utils/Signal';

import type { Slide } from './Slide';
import type { SlideConfig, ViewportConfig } from './types';
import type { Viewport } from './Viewport';

export interface SlideshowProviderProps {
	readonly unmountThreshold?: number;
	readonly remountThreshold?: number;
}

export const SlideshowContext = createContext<SlideshowProvider | null>(null);

export class SlideshowProvider extends Component<SlideshowProviderProps> {
	public readonly navigationChanged = createSignal();
	public activeIndex = -1;
	public slides: readonly SlideInfo[] = [];

	private readonly slideMap = new Map<Slide, SlideInfo>();
	private frame?: number;
	private slideListDirty = false;
	private slideOrderDirty = false;
	private viewport: ViewportInfo | null = null;

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

	public setSlide(slide: Slide, config: SlideConfig<any>, isFrame?: boolean) {
		const existing = this.slideMap.get(slide);
		if (!existing) {
			const newSlide = {
				...config,
				component: slide
			};

			this.slideMap.set(slide, newSlide);
			this.slides = this.slides.concat(newSlide);
			this.slideListDirty = true;
			this.slideOrderDirty = true;
		}
		else if (!apply(existing, config)) {
			return;
		}

		this.update(isFrame);
	}

	public unsetSlide(slide: Slide) {
		if (this.slideMap.delete(slide)) {
			const index = this.slides.findIndex(info => info.component === slide);
			const copy = this.slides.slice();
			copy.splice(index, 1);
			this.slides = copy;
			this.slideListDirty = true;
			this.update();
		}
	}

	public setViewport(viewport: Viewport, config: ViewportConfig, isFrame?: boolean) {
		if (this.viewport?.component !== viewport) {
			this.viewport = {
				...config,
				component: viewport
			};
		}
		else if (!apply(this.viewport, config)) {
			return;
		}

		this.update(isFrame);
	}

	public unsetViewport(viewport: Viewport) {
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

		if (this.slideOrderDirty) {
			this.slides = mergeSort(this.slides, byOrderAsc);
			this.slideOrderDirty = false;
		}

		const { slides, viewport } = this;
		const count = slides.length;

		// Step 1: find the top slide
		// ---

		const offset = Math.abs(viewport.offset);

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

		// Step 2: dispatch layout calls
		// ---

		const positionOffset = viewport.paddingStart - lengthStart;
		const visibilityOffset = viewport.paddingStart - (isDocked ? lengthStart : offset - dockStart);
		const {
			unmountThreshold = 1.5,
			remountThreshold = 0.5
		} = this.props;

		let position = 0;
		let bestScore = 0;
		let bestSlide = -1;

		for (let i = 0; i < count; ++i) {
			const slide = slides[i];
			const visibleLength =
				Math.min(viewport.size, visibilityOffset + position + slide.length) -
				Math.max(0, visibilityOffset + position);

			// clamping to ≤1 avoids float rounding errors
			const score = Math.min(visibleLength / slide.length, 1);
			if (score > bestScore) {
				bestScore = score;
				bestSlide = i;
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

		// Step 3: Update navigation
		// ---

		const hasNavChanged = this.slideListDirty || this.activeIndex !== bestSlide;
		this.slideListDirty = false;
		this.activeIndex = bestSlide;

		if (hasNavChanged) {
			this.navigationChanged();
		}
	};
}

export interface SlideInfo<TMetadata = any> extends Readonly<SlideConfig<TMetadata>> {
	readonly component: Slide;
}

interface ViewportInfo extends Readonly<ViewportConfig> {
	readonly component: Viewport;
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
