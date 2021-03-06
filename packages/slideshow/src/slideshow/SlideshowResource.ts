import { Component } from 'preact';

import { SlideshowContext, SlideshowProvider } from './SlideshowProvider';

export abstract class SlideshowResource<TLayout, TProps = {}, TState = {}> extends Component<TProps, TState> {
	declare public context: SlideshowProvider | null;

	public layout: TLayout | null = null;

	public componentDidMount() {
		this.updateSlideshow();
	}

	public componentDidUpdate() {
		this.updateSlideshow();
	}

	public componentWillUnmount() {
		this.onUpdateSlideshow(null, this.props);
	}

	public shouldComponentUpdate(nextProps: TProps, _nextState: TState, nextContext: SlideshowProvider | null) {
		this.onUpdateSlideshow(nextContext, nextProps);
		return this.context !== nextContext;
	}

	public updateLayout(layout: Readonly<TLayout>) {
		if (this.layout) {
			let hasChanged = false;
			for (const key in layout) {
				if (layout[key] !== this.layout[key]) {
					hasChanged = true;
					break;
				}
			}

			if (!hasChanged) {
				return;
			}
		}

		this.layout = layout;
		this.onUpdateLayout(layout);
	}

	public updateSlideshow(isFrame?: boolean) {
		this.onUpdateSlideshow(this.context, this.props, isFrame);
	}

	protected abstract onUpdateLayout(layout: Readonly<TLayout>): void;
	protected abstract onUpdateSlideshow(context: SlideshowProvider | null, props: TProps, isFrame?: boolean): void;

	public static readonly contextType = SlideshowContext;
}
