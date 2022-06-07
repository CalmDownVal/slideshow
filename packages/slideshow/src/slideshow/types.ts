import type { JSAnimation, JSAnimationOptions } from '~/utils/JSAnimation';

import type { Slide } from './Slide';
import type { Viewport } from './Viewport';

export interface SlideConfig<TMeta = any> {
	dock: number;
	length: number;
	metadata: TMeta;
	order: number;
	isMounted: boolean;
}

export interface SlideLayout<TMeta = any> extends Readonly<SlideConfig<TMeta>> {
	canUnmount: boolean;
	isInvisible: boolean;
	position: number;
	progression: Progression;
}

export interface SlideInfo<TMeta = any> extends Readonly<SlideConfig<TMeta>> {
	readonly component: Slide<TMeta>;
	scrollOffset: number;
}

export interface ViewportConfig {
	offset: number;
	size: number;
	paddingStart: number;
	paddingEnd: number;
}

export interface ViewportLayout extends Readonly<ViewportConfig> {
	isDocked: boolean;
	expandStart: number;
	expandEnd: number;
	totalLength: number;
}

export interface ViewportInfo extends Readonly<ViewportConfig> {
	readonly component: Viewport;
}

export interface Navigation<TMeta = any> {
	activeIndex: number;
	slides: readonly SlideInfo<TMeta>[];
	goTo(index: number, animation?: JSAnimationOptions): JSAnimation | undefined;
}

export interface Progression {
	main: number;
	dock: number;
	enter: number;
	leave: number;
}
