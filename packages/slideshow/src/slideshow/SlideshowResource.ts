import { Component } from 'preact';

import { SlideshowContext, SlideshowProvider } from './SlideshowProvider';
import type { LayoutComponent } from './types';

export abstract class SlideshowResource<TLayout, TProps = {}, TState = {}> extends Component<TProps, TState> implements LayoutComponent<TLayout> {
	declare public context: SlideshowProvider | null;

	public componentDidMount() {
		this.updateSlideshow(this.context, this.props);
	}

	public componentDidUpdate() {
		this.updateSlideshow(this.context, this.props);
	}

	public componentWillUnmount() {
		this.updateSlideshow(null, this.props);
	}

	public shouldComponentUpdate(nextProps: TProps, _nextState: TState, nextContext: SlideshowProvider | null) {
		this.updateSlideshow(nextContext, nextProps);
		return this.context !== nextContext;
	}

	public abstract updateLayout(layout: Readonly<TLayout>): void;

	protected abstract updateSlideshow(context: SlideshowProvider | null, props: TProps): void;

	public static readonly contextType = SlideshowContext;
}
