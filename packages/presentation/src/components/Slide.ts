import { CSSProperties, ComponentType, Component, HTMLAttributes, createElement } from 'react';

import { Navigation, NavigationContext } from '~/context/useNavigation';
import { ProgressionContext } from '~/context/useProgression';
import { UNIT } from '~/utils/constants';
import { createFilter, filterProps } from '~/utils/filterProps';
import { bem, cx } from '~/utils/style';
import type { OptionalsOf } from '~/utils/types';

import type { PresentationBase } from './PresentationBase';

export interface SlideProps extends HTMLAttributes<HTMLElement> {
	readonly component: ComponentType;
	readonly dock?: number;
	readonly length?: number;
	readonly metadata?: any;
	readonly order?: number;
	readonly persist?: boolean;
	readonly tagName?: string;
}

export interface SlideState {
	readonly isClipped: boolean;
	readonly isDocked: boolean;
	readonly isVisible: boolean;
	readonly layout: CSSProperties;
	readonly progression: number;
}

const OWN_PROPS = createFilter<keyof SlideProps>([
	'children',
	'component',
	'dock',
	'length',
	'metadata',
	'order',
	'persist',
	'style',
	'tagName'
]);

export class Slide extends Component<SlideProps, SlideState> {
	declare public context: Navigation | null;
	public readonly state: SlideState = {
		isClipped: true,
		isDocked: false,
		isVisible: false,
		layout: {},
		progression: 0
	};

	private presentation: PresentationBase | null = null;
	private fallbackOrder: number | null = null;

	/** @internal */
	public get order() {
		return this.props.order ?? this.fallbackOrder ?? 0;
	}

	public render() {
		if ((this.state.isClipped && !this.props.persist) || !this.presentation) {
			return null;
		}

		const props = filterProps(this.props, OWN_PROPS);
		props.className = cx(
			bem('cdv-presentation__slide', {
				docked: this.state.isDocked,
				visible: this.state.isVisible
			}),
			this.props.className
		);

		props.style = this.props.style
			? {
				...this.props.style,
				...this.state.layout
			}
			: this.state.layout;

		if (this.state.isClipped) {
			// Slide would normally be removed from the DOM, but is marked as
			// persistent
			props.style.visibility = 'hidden';
		}

		return createElement(
			this.props.tagName as 'article',
			props,
			createElement(
				ProgressionContext.Provider,
				{ value: this.state.progression },
				createElement(this.props.component)
			)
		);
	}

	public componentDidMount() {
		this.updateRegistration();
	}

	public componentDidUpdate() {
		this.updateRegistration();
	}

	public componentWillUnmount() {
		this.presentation?.unregister(this);
		this.presentation = null;
	}

	private updateRegistration() {
		const oldPresentation = this.presentation;
		const newPresentation = this.context?.presentation;
		if (oldPresentation === newPresentation) {
			return;
		}

		oldPresentation?.unregister(this);
		this.presentation = newPresentation ?? null;
		if (newPresentation) {
			this.fallbackOrder = newPresentation.getFallbackOrder();
			newPresentation.register(this);
		}
	}

	public static readonly contextType = NavigationContext;
	public static readonly defaultProps: OptionalsOf<SlideProps> = {
		dock: 0,
		length: UNIT,
		persist: false,
		tagName: 'article'
	};
}
