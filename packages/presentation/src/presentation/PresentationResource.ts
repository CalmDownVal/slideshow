import { Component } from 'preact';

import type { Navigation } from './Navigation';
import { PresentationBase, PresentationContext } from './PresentationBase';

export abstract class PresentationResource<TProps = {}, TState = {}> extends Component<TProps, TState> {
	declare public context: Navigation | null;

	protected presentation: PresentationBase | null = null;

	public componentDidMount() {
		this.onUpdateRegistration();
	}

	public componentDidUpdate() {
		this.onUpdateRegistration();
	}

	public componentWillUnmount() {
		this.updateRegistration(null);
	}

	protected abstract updateRegistration(newPresentation: PresentationBase | null): void;

	private onUpdateRegistration() {
		const presentation = this.context?.presentation ?? null;
		if (presentation !== this.presentation) {
			this.updateRegistration(presentation);
			this.presentation = presentation;
		}
	}

	public static readonly contextType = PresentationContext;
}
