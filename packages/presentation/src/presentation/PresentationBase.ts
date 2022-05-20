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
	readonly dockOffset?: number;
	readonly tagName?: string;
}

export const PresentationContext = createContext<Navigation | null>(null);

export abstract class PresentationBase<TProps extends PresentationBaseProps = PresentationBaseProps> extends Component<TProps> {
	// in presentation units
	protected position = 0;

	// in logical pixels
	protected viewport: HTMLElement | null = null;
	protected viewportScrollSize = 0;
	protected viewportSize = 0;

	private frame?: number;
	private isLayoutDirty = true;
	private isSlidesDirty = false;
	private isUpdateScheduled = false;

	private expander: HTMLElement | null = null;
	private navigation: Navigation;
	private observer?: ResizeObserver;
	private slideOrder = 0;
	private slides: Slide[] = [];

	public constructor(props: TProps) {
		super(props);

		// must be within a constructor, otherwise `this` references Window when using CJS
		this.navigation = new Navigation(this, -1, []);
		this.observer = new ResizeObserver(() => {
			this.isLayoutDirty = true;
			this.update();
		});
	}

	public get isHorizontal() {
		return this.props.direction === Direction.LeftToRight;
	}

	public componentDidMount() {
		this.update();
	}

	public componentDidUpdate() {
		this.update();
	}

	public componentWillUnmount() {
		if (this.isUpdateScheduled) {
			cancelAnimationFrame(this.frame!);
			this.isUpdateScheduled = false;
		}

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
	public setViewport(viewport: HTMLElement | null) {
		if (this.viewport) {
			this.observer?.disconnect();
		}

		this.viewport = viewport;
		if (viewport) {
			this.observer?.observe(viewport);
		}

		this.isLayoutDirty = true;
		this.update();
	}

	/** @internal */
	public setExpander(expander: HTMLElement | null) {
		this.expander = expander;
	}

	protected setPosition(position: number) {
		if (position !== this.position) {
			this.position = position;
			this.update();
		}
	}

	protected update() {
		if (!this.isUpdateScheduled) {
			this.frame = requestAnimationFrame(this.onUpdate);
			this.isUpdateScheduled = true;
		}
	}

	private readonly onUpdate = () => {
		this.isUpdateScheduled = false;

		const { expander, isHorizontal, slides, viewport } = this;
		const { clipThreshold, dockOffset } = this.props;
		const axisPosition = isHorizontal ? 'left' : 'top';
		const axisLength = isHorizontal ? 'width' : 'height';

		if (this.isLayoutDirty && viewport) {
			this.viewportSize = isHorizontal ? viewport.clientWidth : viewport.clientHeight;
			this.isLayoutDirty = false;
		}

		if (this.isSlidesDirty) {
			this.slides = mergeSort(this.slides, byOrderAsc);
			this.isSlidesDirty = false;
		}

	};

	public static readonly defaultProps: OptionalsOf<PresentationBaseProps> = {
		clipThreshold: UNIT / 3,
		direction: Direction.TopToBottom,
		dockOffset: 0,
		tagName: 'div'
	};
}

function byOrderAsc(a: Slide, b: Slide) {
	return a.order - b.order;
}
