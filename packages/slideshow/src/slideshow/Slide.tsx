import { createContext, ComponentType, h } from 'preact';

import { bemUpdate } from '~/utils/style';

import type { SlideshowProvider } from './SlideshowProvider';
import { SlideshowResource } from './SlideshowResource';
import type { SlideLayout } from './types';

import './Slide.css';

export interface SlideComponentProps<TMeta = any> {
	readonly metadata?: TMeta;
}

export interface SlideProps<TMeta = any> {
	readonly component: ComponentType<SlideComponentProps<TMeta>>;
	readonly dock?: number;
	readonly length?: number;
	readonly metadata?: TMeta;
	readonly order?: number;
	readonly persist?: boolean;
}

export interface SlideState {
	readonly canUnmount: boolean;
}

export const SlideContext = createContext<Slide | null>(null);

export class Slide<TMeta = any> extends SlideshowResource<SlideLayout, SlideProps, SlideState> {
	public readonly state = {
		canUnmount: false
	};

	private fallbackOrder = 0;
	private wrapper: HTMLElement | null = null;

	public shouldComponentUpdate(
		nextProps: SlideProps<TMeta>,
		nextState: SlideState,
		nextContext: SlideshowProvider | null
	) {
		if (super.shouldComponentUpdate(nextProps, nextState, nextContext)) {
			return true;
		}

		const prevProps = this.props;
		const prevState = this.state;
		return (
			prevState.canUnmount !== nextState.canUnmount ||
			prevProps.component !== nextProps.component ||
			prevProps.metadata !== nextProps.metadata
		);
	}

	public render() {
		return this.state.canUnmount
			? null
			: (
				<div class='slideshow__slide' ref={this.onWrapperRef}>
					<SlideContext.Provider value={this}>
						{h(this.props.component, { metadata: this.props.metadata })}
					</SlideContext.Provider>
				</div>
			);
	}

	public updateLayout(layout: Readonly<SlideLayout>) {
		this.setState({ canUnmount: layout.canUnmount });
		if (!this.wrapper) {
			return;
		}

		bemUpdate(this.wrapper.classList, 'slideshow__slide', {
			visible: layout.isVisible
		});

		this.wrapper.style.setProperty('--slide-position', '' + layout.position);
		this.wrapper.style.setProperty('--slide-length', '' + layout.length);
	}

	protected updateSlideshow(context: SlideshowProvider | null, props: SlideProps) {
		if (context !== this.context) {
			this.context?.unsetSlide(this);
		}

		context?.setSlide(this, {
			dock: props.dock ?? 0,
			length: props.length ?? 1,
			metadata: props.metadata,
			order: props.order ?? this.fallbackOrder
		});
	}

	private readonly onWrapperRef = (wrapper: HTMLElement | null) => {
		if (wrapper && this.props.order === undefined) {
			const prev = getOrder(wrapper.previousElementSibling);
			const next = getOrder(wrapper.nextElementSibling);

			/* eslint-disable no-negated-condition */
			if (prev !== undefined && next !== undefined) {
				this.fallbackOrder = Math.trunc((next - prev) / 2);
			}
			else if (prev !== undefined) {
				this.fallbackOrder = prev + 1;
			}
			else if (next !== undefined) {
				this.fallbackOrder = next - 1;
			}
			else {
				this.fallbackOrder = 0;
			}

			wrapper.dataset.order = '' + this.fallbackOrder;
		}

		this.wrapper = wrapper;
	};

	public static readonly contextType = SlideshowResource.contextType;
}

function getOrder(elem: Element | null) {
	const orderStr = (elem as HTMLElement | null)?.dataset.order;
	if (orderStr) {
		const order = Number(orderStr);
		if (!Number.isNaN(order)) {
			return order;
		}
	}

	return undefined;
}
