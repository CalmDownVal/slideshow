import { createContext, ComponentType, h } from 'preact';

import { UNIT } from '~/utils/constants';
import { bem, cx, percent } from '~/utils/style';
import type { OptionalsOf } from '~/utils/types';

import type { Navigation } from './Navigation';
import type { PresentationBase } from './PresentationBase';
import { PresentationResource } from './PresentationResource';
import { Progression } from './Progression';

export interface SlideComponentProps<TMeta = any> {
	readonly metadata?: TMeta;
}

export interface SlideProps<TMeta = any>{
	readonly metadata?: TMeta;
	readonly tagProps?: Omit<h.JSX.HTMLAttributes<HTMLElement>, 'children'>;

	// must not change after mounting:
	readonly component: ComponentType<SlideComponentProps<TMeta>>;
	readonly dock?: number;
	readonly length?: number;
	readonly order?: number;
	readonly persist?: boolean;
	readonly tagName?: string;
}

export interface SlideState {
	readonly canGetClipped: boolean;
	readonly isVisible: boolean;
	readonly position: number;
	readonly progression: number;
}

export const ProgressionContext = createContext<Progression | null>(null);

export class Slide<TMeta = any> extends PresentationResource<SlideProps<TMeta>, SlideState> {
	declare public context: Navigation | null;
	public readonly state: SlideState = {
		canGetClipped: false,
		isVisible: false,
		position: 0,
		progression: 0
	};

	private fallbackOrder?: number;
	private progression: Progression | null = null;

	/** @internal */
	public get order() {
		return this.props.order ?? this.fallbackOrder ?? 0;
	}

	public componentWillUnmount() {
		super.componentWillUnmount();
		this.presentation?.removeSlide(this);
		this.presentation = null;
	}

	public shouldComponentUpdate(nextProps: SlideProps<TMeta>, nextState: SlideState) {
		const prevProps = this.props;
		const prevState = this.state;

		if (nextState.isVisible !== prevState.isVisible) {
			return true;
		}

		return prevState.isVisible
			? (
				nextState.position !== prevState.position ||
				nextProps.metadata !== prevProps.metadata ||
				nextProps.tagProps !== prevProps.tagProps
			)
			: (
				nextState.canGetClipped !== prevState.canGetClipped
			);
	}

	public render() {
		if (!this.context) {
			throw new Error('Slide can only be used as a descendant of a Presentation.');
		}

		if (!this.presentation || (this.state.canGetClipped && !this.props.persist)) {
			return null;
		}

		if (this.progression?.value !== this.state.progression) {
			this.progression = Progression.create(
				this.state.progression,
				this.props.length!,
				this.props.dock!
			);
		}

		const props = this.props.tagProps ? { ...this.props.tagProps } : {};
		props.style = `--cdv-position: ${percent(this.state.position / UNIT)};`;
		props.class = cx(
			bem('cdv-presentation__slide', {
				visible: this.state.isVisible
			}),
			props.class
		);

		return h(
			this.props.tagName!,
			props as any,
			h(ProgressionContext.Provider, {
				value: this.progression,
				children: h(this.props.component, {
					metadata: this.props.metadata
				})
			})
		);
	}

	protected updateRegistration(presentation: PresentationBase | null) {
		this.presentation?.removeSlide(this);
		if (presentation) {
			this.fallbackOrder = presentation.getFallbackOrder();
			presentation.addSlide(this);
		}
	}

	public static readonly contextType = PresentationResource.contextType;
	public static readonly defaultProps: OptionalsOf<SlideProps> = {
		dock: 0,
		length: UNIT,
		persist: false,
		tagName: 'article'
	};
}
