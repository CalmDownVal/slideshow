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
