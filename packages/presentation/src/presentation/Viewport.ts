import { Component, h } from 'preact';

import type { Navigation } from '~/presentation/Navigation';
import { PresentationContext } from '~/presentation/PresentationBase';
import { bem, cx } from '~/utils/style';
import type { OptionalsOf } from '~/utils/types';

export interface ViewportProps {
	readonly scrollable?: boolean;
	readonly tagName?: string;
	readonly tagProps?: Omit<h.JSX.HTMLAttributes<HTMLElement>, 'children'>;
}

export class Viewport extends Component<ViewportProps> {
	declare public context: Navigation | null;

	public render() {
		if (!this.context) {
			throw new Error('<Viewport /> can only be used within a <Presentation />');
		}

		const { isHorizontal } = this.context.presentation;
		const props = this.props.tagProps ? { ...this.props.tagProps } : {};

		props.ref = this.onViewportRef;
		props.class = cx(
			bem('cdv-presentation__viewport', {
				horizontal: isHorizontal,
				vertical: !isHorizontal,
				scrollable: this.props.scrollable
			}),
			props.class
		);

		return h(
			this.props.tagName!,
			props as any,
			this.props.children,
			h('div', {
				'class': 'cdv-presentation__expander',
				'ref': this.onExpanderRef as any
			})
		);
	}

	private readonly onViewportRef = (viewport: HTMLElement | null) => {
		this.context!.presentation.setViewport(viewport);
	};

	private readonly onExpanderRef = (expander: HTMLElement | null) => {
		this.context!.presentation.setExpander(expander);
	};

	public static readonly contextType = PresentationContext;
	public static readonly defaultProps: OptionalsOf<ViewportProps> = {
		scrollable: false,
		tagName: 'div'
	};
}
