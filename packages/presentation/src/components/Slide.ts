import { CSSProperties, ComponentType, Component, HTMLAttributes, createElement, ReactNode } from 'react';

import { Navigation, NavigationContext } from '~/context/useNavigation';
import { Progression, ProgressionContext } from '~/context/useProgression';
import { UNIT } from '~/utils/constants';
import { createFilter, filterProps } from '~/utils/filterProps';
import { bem, cx } from '~/utils/style';
import type { OptionalsOf } from '~/utils/types';

import type { PresentationBase } from './PresentationBase';

export interface SliceComponentProps<TMeta = any> {
	readonly metadata?: TMeta;
}

export interface SlideProps<TMeta = any> extends HTMLAttributes<HTMLElement> {
	readonly component: ComponentType<SliceComponentProps<TMeta>>;
	readonly dock?: number;
	readonly length?: number;
	readonly metadata?: TMeta;
	readonly order?: number;
	readonly persist?: boolean;
	readonly tagName?: string;
}

export interface SlideState {
	readonly isClipped: boolean;
	readonly isDocked: boolean;
	readonly isVisible: boolean;
	readonly layout: CSSProperties;
	readonly progressionValue: number;
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

export class Slide<TMeta = any> extends Component<SlideProps<TMeta>, SlideState> {
	declare public context: Navigation | null;
	public readonly state: SlideState = {
		isClipped: true,
		isDocked: false,
		isVisible: false,
		layout: {},
		progressionValue: 0
	};

	private fallbackOrder: number | null = null;
	private presentation: PresentationBase | null = null;
	private progression: Progression | null = null;

	/** @internal */
	public get order() {
		return this.props.order ?? this.fallbackOrder ?? 0;
	}

	public render(): ReactNode {
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

		// Slide would normally be removed from the DOM, but is marked as persistent
		if (this.state.isClipped) {
			props.style.visibility = 'hidden';
		}

		// create a new Progression instance if necessary (updates context)
		if (this.progression?.value !== this.state.progressionValue) {
			this.progression = Progression.create(
				this.state.progressionValue,
				this.props.dock!,
				this.props.length!
			);
		}

		return createElement(
			this.props.tagName!,
			props,
			createElement(
				ProgressionContext.Provider,
				{ value: this.progression },
				createElement(
					this.props.component,
					{ metadata: this.props.metadata }
				)
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
