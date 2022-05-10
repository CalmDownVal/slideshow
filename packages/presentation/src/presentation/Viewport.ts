import { ClassAttributes, Component, h } from 'preact';

import type { Navigation } from '~/presentation/Navigation';
import { PresentationContext } from '~/presentation/PresentationBase';
import { createFilter, excludeProps } from '~/utils/excludeProps';
import { bem, cx } from '~/utils/style';
import type { OptionalsOf } from '~/utils/types';

export interface ViewportProps extends h.JSX.HTMLAttributes<HTMLElement> {
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

	public render() {
		if (!this.context) {
			throw new Error('<Viewport /> can only be used within a <Presentation />');
		}

		const props = excludeProps<ViewportProps & ClassAttributes<HTMLDivElement>>(this.props, OWN_PROPS);
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

		return h(
			this.props.tagName as 'div',
			props as any,
			this.props.children,
			h('div', {
				className: 'cdv-presentation__expander',
				ref: this.onExpanderRef as any
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
