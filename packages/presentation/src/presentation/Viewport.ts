import { h, RenderableProps } from 'preact';

import { bem, cx } from '~/utils/style';
import type { OptionalsOf } from '~/utils/types';

import type { Navigation } from './Navigation';
import type { PresentationBase } from './PresentationBase';
import { PresentationResource } from './PresentationResource';

export enum Direction {
	TopToBottom,
	LeftToRight,
	BottomToTop,
	RightToLeft
}

export interface ViewportProps {
	readonly tagProps?: Omit<h.JSX.HTMLAttributes<HTMLElement>, 'children'>;

	// must not change after mounting:
	readonly direction?: Direction;
	readonly scrollable?: boolean;
	readonly tagName?: string;
}

export class Viewport extends PresentationResource<ViewportProps> {
	declare public context: Navigation | null;

	public ref: HTMLElement | null = null;

	private observer: ResizeObserver | null = null;
	private offset = 0;
	private size = 0;

	public get isHorizontal() {
		const { direction } = this.props;
		return (
			direction === Direction.LeftToRight ||
			direction === Direction.RightToLeft
		);
	}

	public componentWillUnmount() {
		super.componentWillUnmount();
		this.observer?.disconnect();
		this.observer = null;
	}

	public shouldComponentUpdate(next: RenderableProps<ViewportProps>) {
		const prev = this.props;
		return (
			next.children !== prev.children ||
			next.tagProps !== prev.tagProps
		);
	}

	public render() {
		if (!this.context) {
			throw new Error('Viewport can only be used as a descendant of a Presentation.');
		}

		const { direction } = this.props;
		const props = this.props.tagProps ? { ...this.props.tagProps } : {};

		props.ref = this.onViewportRef;
		props.class = cx(
			bem('cdv-presentation__viewport', {
				'top-to-bottom': direction === Direction.TopToBottom,
				'left-to-right': direction === Direction.LeftToRight,
				'bottom-to-top': direction === Direction.BottomToTop,
				'right-to-left': direction === Direction.RightToLeft,
				'scrollable': this.props.scrollable
			}),
			props.class
		);

		return h(
			this.props.tagName!,
			props as any,
			this.props.children,
			h('div', {
				'class': 'cdv-presentation__expander'
			})
		);
	}

	/** @internal */
	public setOffset(offset: number, force = false) {
		if (this.ref && (offset !== this.offset || force)) {
			this.ref.scrollTo(
				this.isHorizontal ? offset * this.size : 0,
				this.isHorizontal ? 0 : offset * this.size
			);
		}

		this.offset = offset;
	}

	protected updateRegistration(newPresentation: PresentationBase | null) {
		this.presentation?.setViewport(null);
		newPresentation?.setViewport(this);
	}

	private readonly onViewportRef = (ref: HTMLElement | null) => {
		if (this.ref) {
			this.observer!.unobserve(this.ref);
		}

		this.ref = ref;
		if (ref) {
			this.observer ??= new ResizeObserver(this.onResizeObserved);
			this.observer.observe(ref);
		}
	};

	private readonly onResizeObserved = () => {
		this.size = this.isHorizontal ? this.ref!.clientWidth : this.ref!.clientHeight;
		this.setOffset(this.offset, true);
	};

	public static readonly contextType = PresentationResource.contextType;
	public static readonly defaultProps: OptionalsOf<ViewportProps> = {
		direction: Direction.TopToBottom,
		scrollable: false,
		tagName: 'div'
	};
}
