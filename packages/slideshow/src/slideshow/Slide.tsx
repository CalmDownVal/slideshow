import { createContext, ComponentType, h } from 'preact';

import { createSignal } from '~/utils/Signal';
import { bem, cx } from '~/utils/style';

import type { SlideshowProvider } from './SlideshowProvider';
import { SlideshowResource } from './SlideshowResource';
import { SlideLayout } from './types';

export interface SlideContentProps<TMeta = any> {
	readonly metadata: TMeta;
}

export interface SlideProps<TMeta = any> {
	readonly class?: string;
	readonly content: ComponentType<SlideContentProps<TMeta>>;
	readonly dock?: number;
	readonly length?: number;
	readonly metadata: TMeta;
	readonly order?: number;
	readonly persist?: boolean;
}

export interface SlideState {
	readonly canUnmount: boolean;
}

export const SlideContext = createContext<Slide | null>(null);

export class Slide<TMeta = any> extends SlideshowResource<SlideLayout, SlideProps<TMeta>, SlideState> {
	public readonly state = { canUnmount: false };
	public readonly progressionChanged = createSignal();

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
			prevProps.content !== nextProps.content ||
			prevProps.metadata !== nextProps.metadata
		);
	}

	public render({ class: customClass, content, metadata, persist }: SlideProps<TMeta>, { canUnmount }: SlideState) {
		return (
			<div
				ref={this.onWrapperRef}
				class={cx(
					bem('slideshow__slide', {
						invisible: this.layout?.isInvisible
					}),
					customClass
				)}
			>
				{canUnmount && !persist
					? null
					: (
						<SlideContext.Provider value={this}>
							{h(content, { metadata })}
						</SlideContext.Provider>
					)}
			</div>
		);
	}

	protected onUpdateLayout(layout: Readonly<SlideLayout>) {
		this.setState({ canUnmount: layout.canUnmount });
		if (!this.wrapper) {
			return;
		}

		const { classList, style } = this.wrapper;
		style.order = '' + layout.order;
		style.setProperty('--ss-position', '' + layout.position);
		style.setProperty('--ss-length', '' + layout.length);
		classList.toggle('slideshow__slide--invisible', layout.isInvisible);

		this.progressionChanged();
	}

	protected onUpdateSlideshow(context: SlideshowProvider | null, props: SlideProps<TMeta>, isFrame?: boolean) {
		if (context !== this.context) {
			this.context?.unsetSlide(this);
		}

		context?.setSlide(this, {
			dock: props.dock ?? 0,
			length: props.length ?? 1,
			metadata: props.metadata,
			order: props.order ?? this.fallbackOrder,
			isMounted: !this.state.canUnmount
		}, isFrame);
	}

	private readonly onWrapperRef = (wrapper: HTMLElement | null) => {
		this.wrapper = wrapper;
		if (!wrapper) {
			return;
		}

		let { order } = this.props;
		if (order === undefined) {
			const prev = getOrder(wrapper.previousElementSibling);
			const next = getOrder(wrapper.nextElementSibling);

			/* eslint-disable no-negated-condition */
			if (prev !== undefined && next !== undefined) {
				order = Math.trunc((next - prev) / 2);
			}
			else if (prev !== undefined) {
				order = prev + 1;
			}
			else if (next !== undefined) {
				order = next - 1;
			}
			else {
				order = 0;
			}
		}

		wrapper.dataset.order = '' + order;
		this.fallbackOrder = order;
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
