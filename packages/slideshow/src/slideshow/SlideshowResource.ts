import { Component } from 'preact';

import { apply } from '~/utils/props';

import { SlideshowContext, SlideshowProvider } from './SlideshowProvider';
import type { LayoutComponent } from './types';

export abstract class SlideshowResource<TLayout, TProps = {}, TState = {}> extends Component<TProps, TState> implements LayoutComponent<TLayout> {
	declare public context: SlideshowProvider | null;

	private layout?: TLayout;

	public componentDidMount() {
		this.updateSlideshow();
	}

	public componentDidUpdate() {
		this.updateSlideshow();
	}

	public componentWillUnmount() {
		this.updateSlideshow(null);
	}

	public shouldComponentUpdate(nextProps: TProps, _nextState: TState, nextContext: SlideshowProvider | null) {
		this.updateSlideshow(nextContext, nextProps);
		return this.context !== nextContext;
	}

	public updateLayout(layout: Readonly<TLayout>) {
		if (!this.layout || apply(this.layout, layout)) {
			this.onUpdateLayout(this.layout ??= layout);
		}
	}

	public updateSlideshow(
		context: SlideshowProvider | null = this.context,
		props: TProps = this.props
	) {
		this.onUpdateSlideshow(context, props);
	}

	protected abstract onUpdateLayout(layout: Readonly<TLayout>): void;
	protected abstract onUpdateSlideshow(context: SlideshowProvider | null, props: TProps): void;

	public static readonly contextType = SlideshowContext;
}
