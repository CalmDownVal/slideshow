import { createContext, Component, h, RenderableProps } from 'preact';

import { UNIT } from '~/utils/constants';
import type { JSAnimation, JSAnimationOptions } from '~/utils/JSAnimation';
import { clamp } from '~/utils/math';
import { mergeSort } from '~/utils/mergeSort';
import type { OptionalsOf } from '~/utils/types';

import { Navigation } from './Navigation';
import type { Slide } from './Slide';
import type { Viewport } from './Viewport';

export interface PresentationBaseProps {
	// must not change after mounting:
	readonly clipThreshold?: number;
	readonly paddingStart?: number;
	readonly paddingEnd?: number;
}

export const PresentationContext = createContext<Navigation | null>(null);

export abstract class PresentationBase<TProps extends PresentationBaseProps = PresentationBaseProps, TState = {}> extends Component<TProps, TState> {
	/** @internal @readonly */
	public presentationPosition = 0;

	/** @internal @readonly */
	public presentationLength = 1;

	/** @internal @readonly */
	public viewport: Viewport | null = null;

	private isOffsetDirty = false;
	private isSlidesDirty = false;
	private navigation: Navigation;
	private slideOrder = 0;
	private slides: Slide[] = [];
	private updateFrame?: number;

	public constructor(props: TProps) {
		super(props);
		this.navigation = new Navigation(this, -1, []);
	}

	public componentDidMount() {
		this.update();
	}

	public componentWillUnmount() {
		this.cancelUpdate();
	}

	public shouldComponentUpdate(next: RenderableProps<TProps>) {
		return this.props.children !== next.children;
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
		this.isSlidesDirty = true;
		this.update();
	}

	/** @internal */
	public removeSlide(slide: Slide) {
		const index = this.slides.indexOf(slide);
		if (index !== -1) {
			this.slides.splice(index, 1);
			this.update();
		}
	}

	/** @internal */
	public setViewport(viewport: Viewport | null) {
		if (viewport !== this.viewport) {
			this.viewport = viewport;
			this.update();
		}
	}

	protected setPosition(position: number, isFrameAligned = false) {
		const safePosition = clamp(position);
		if (safePosition !== this.presentationPosition) {
			this.presentationPosition = safePosition;
			this.isOffsetDirty = true;
			this.update(isFrameAligned);
		}
	}

	private update(isFrameAligned = false) {
		if (isFrameAligned) {
			this.cancelUpdate();
			this.onUpdate();
			return;
		}

		this.updateFrame ??= requestAnimationFrame(this.onUpdate);
	}

	private cancelUpdate() {
		if (this.updateFrame !== undefined) {
			cancelAnimationFrame(this.updateFrame);
			this.updateFrame = undefined;
		}
	}

	private readonly onUpdate = () => {
		this.updateFrame = undefined;
		if (!this.viewport) {
			return;
		}

		if (this.isOffsetDirty) {
			this.viewport.setOffset(this.presentationPosition);
			this.isOffsetDirty = false;
		}

		if (this.isSlidesDirty) {
			this.slides = mergeSort(this.slides, byOrderAsc);
			this.presentationLength =
				this.slides.reduce(sumLength, 0) +
				this.props.paddingStart! +
				this.props.paddingEnd!;

			this.isSlidesDirty = false;
		}

		// figure out the current slide and whether it is docked or not


		// layout all other slides accordingly
	};

	public static readonly defaultProps: OptionalsOf<PresentationBaseProps> = {
		clipThreshold: UNIT / 3,
		paddingStart: 0,
		paddingEnd: 0
	};
}

function byOrderAsc(a: Slide, b: Slide) {
	return a.order - b.order;
}

function sumLength(sum: number, slide: Slide) {
	return sum + slide.props.length! + slide.props.dock!;
}
