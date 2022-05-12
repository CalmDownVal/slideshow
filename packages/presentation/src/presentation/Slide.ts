import { createContext, ComponentType, Component, h } from 'preact';

import type { Navigation } from '~/presentation/Navigation';
import { Progression } from '~/presentation/Progression';
import { UNIT } from '~/utils/constants';
import { createFilter, excludeProps } from '~/utils/excludeProps';
import { bem, cx } from '~/utils/style';
import type { OptionalsOf } from '~/utils/types';

import { PresentationBase, PresentationContext } from './PresentationBase';

export interface SlideComponentProps<TMeta = any> {
	readonly metadata?: TMeta;
}

export interface SlideProps<TMeta = any> extends h.JSX.HTMLAttributes<HTMLElement> {
	readonly component: ComponentType<SlideComponentProps<TMeta>>;
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
	readonly layout: h.JSX.CSSProperties;
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

export const ProgressionContext = createContext<Progression | null>(null);

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

	public render() {
		if (!this.context) {
			throw new Error('<Slide /> can only be used within a <Presentation />');
		}

		if ((this.state.isClipped && !this.props.persist) || !this.presentation) {
			return null;
		}

		const props = excludeProps(this.props, OWN_PROPS);
		props.class = cx(
			bem('cdv-presentation__slide', {
				docked: this.state.isDocked,
				visible: this.state.isVisible
			}),
			this.props.class
		);

		props.style = typeof this.props.style === 'object'
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

		return h(this.props.tagName!, props as any, h(ProgressionContext.Provider, {
			value: this.progression,
			children: h(
				this.props.component,
				{ metadata: this.props.metadata }
			)
		}));
	}

	public componentDidMount() {
		this.updateRegistration();
	}

	public componentDidUpdate() {
		this.updateRegistration();
	}

	public componentWillUnmount() {
		this.presentation?.removeSlide(this);
		this.presentation = null;
	}

	private updateRegistration() {
		const oldPresentation = this.presentation;
		const newPresentation = this.context?.presentation;
		if (oldPresentation === newPresentation) {
			return;
		}

		oldPresentation?.removeSlide(this);
		this.presentation = newPresentation ?? null;
		if (newPresentation) {
			this.fallbackOrder = newPresentation.getFallbackOrder();
			newPresentation.addSlide(this);
		}
	}

	public static readonly contextType = PresentationContext;
	public static readonly defaultProps: OptionalsOf<SlideProps> = {
		dock: 0,
		length: UNIT,
		persist: false,
		tagName: 'article'
	};
}
