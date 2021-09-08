import { Component, createElement, HTMLAttributes, ReactNode, RefAttributes } from 'react';

import type { Navigation } from '~/presentation/Navigation';
import { PresentationContext } from '~/presentation/PresentationBase';
import { createFilter, filterProps } from '~/utils/filterProps';
import { bem, cx } from '~/utils/style';
import type { OptionalsOf } from '~/utils/types';

export interface ViewportProps extends HTMLAttributes<HTMLElement> {
	readonly scrollable?: boolean;
	readonly tagName?: string;
}

const OWN_PROPS = createFilter<keyof ViewportProps>([
	'children',
	'scrollable',
	'tagName'
]);

export class Viewport extends Component<ViewportProps> {
	declare public context: Navigation | null;

	public render(): ReactNode {
		if (!this.context) {
			throw new Error('<Viewport /> can only be used within a <Presentation />');
		}

		const props = filterProps<ViewportProps & RefAttributes<HTMLDivElement>>(this.props, OWN_PROPS);
		const { isHorizontal } = this.context.presentation;

		props.ref = this.onViewportRef;
		props.className = cx(
			bem('cdv-presentation__viewport', {
				horizontal: isHorizontal,
				vertical: !isHorizontal,
				scrollable: this.props.scrollable
			}),
			this.props.className
		);

		return createElement(
			this.props.tagName as 'div',
			props,
			this.props.children,
			createElement('div', {
				className: 'cdv-presentation__expander',
				ref: this.onExpanderRef
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
