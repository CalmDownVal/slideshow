export interface JSAnimationCallback {
	(x: number): void;
}

export interface EasingFunction {
	(x: number): number;
}

interface JSAnimationProps {
	duration: number;
	easing: EasingFunction;
	valueFrom: number;
	valueTo: number;
}

export type JSAnimationOptions = Partial<JSAnimationProps>;

export class JSAnimation implements JSAnimationProps {
	public duration = 500;
	public easing: EasingFunction = linear;
	public valueFrom = 0.0;
	public valueTo = 1.0;

	private handle?: number;
	private startTime?: number;

	public constructor(
		private readonly callback: JSAnimationCallback,
		options?: JSAnimationOptions
	) {
		Object.assign(this, options);
	}

	public get isRunning() {
		return this.handle !== undefined;
	}

	public start(options?: JSAnimationOptions) {
		this.stop();
		Object.assign(this, options);
		this.startTime = undefined;
		this.handle = requestAnimationFrame(this.onTick);
	}

	public stop() {
		if (this.handle !== undefined) {
			cancelAnimationFrame(this.handle);
			this.handle = undefined;
		}
	}

	private readonly onTick = (time: number) => {
		this.startTime ??= time;

		const progress = this.duration <= 0 ? 1 : Math.min((time - this.startTime) / this.duration, 1);
		const value = this.valueFrom + this.easing(progress) * (this.valueTo - this.valueFrom);

		this.callback(value);
		this.handle = progress < 1
			? requestAnimationFrame(this.onTick)
			: undefined;
	};

	public static animate(callback: JSAnimationCallback, options?: JSAnimationOptions) {
		const instance = new JSAnimation(callback, options);
		instance.start();
		return instance;
	}
}

// basic easing functions
export function linear(x: number) {
	return x;
}

export function smoothStep(x: number) {
	return x * x * (3.0 - 2.0 * x);
}

export function smootherStep(x: number) {
	return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}
