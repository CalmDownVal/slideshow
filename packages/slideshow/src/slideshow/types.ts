import type { Slide } from './Slide';
import type { Viewport } from './Viewport';

export interface SlideConfig<TMetadata> {
	dock: number;
	length: number;
	metadata: TMetadata;
	order: number;
	isMounted: boolean;
}

export interface SlideLayout extends Readonly<SlideConfig<any>> {
	canUnmount: boolean;
	isInvisible: boolean;
	position: number;
}

export interface SlideInfo<TMetadata = any> extends Readonly<SlideConfig<TMetadata>> {
	readonly component: Slide;
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
}

export interface ViewportInfo extends Readonly<ViewportConfig> {
	readonly component: Viewport;
}
