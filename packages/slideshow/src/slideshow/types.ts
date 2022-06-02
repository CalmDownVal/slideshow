export interface LayoutComponent<T> {
	updateLayout(layout: Readonly<T>): void;
}

export interface SlideConfig {
	dock: number;
	length: number;
	order: number;
}

export interface SlideLayout extends Readonly<SlideConfig> {
	canUnmount: boolean;
	isVisible: boolean;
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
