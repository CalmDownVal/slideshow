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
	public easing: EasingFunction = smoothStep;
	public valueFrom = 0.0;
	public valueTo = 1.0;

	private frame?: number;
	private startTime?: number;
	private lastValue = 0.0;

	public constructor(
		private readonly callback: JSAnimationCallback,
		options?: JSAnimationOptions
	) {
		Object.assign(this, options);
	}

	public get isRunning() {
		return this.frame !== undefined;
	}

	public start(options?: JSAnimationOptions) {
		this.stop();
		this.valueFrom = this.lastValue;
		this.startTime = undefined;
		Object.assign(this, options);
		this.frame = requestAnimationFrame(this.onTick);
	}

	public stop() {
		if (this.frame !== undefined) {
			cancelAnimationFrame(this.frame);
			this.frame = undefined;
		}
	}

	private readonly onTick = (time: number) => {
		this.startTime ??= time;
		const progress = this.duration <= 0 ? 1 : Math.min((time - this.startTime) / this.duration, 1);

		this.lastValue = this.valueFrom + this.easing(progress) * (this.valueTo - this.valueFrom);
		this.callback(this.lastValue);

		this.frame = progress < 1
			? requestAnimationFrame(this.onTick)
			: undefined;
	};

	public static animate(callback: JSAnimationCallback, options?: JSAnimationOptions) {
		const instance = new JSAnimation(callback, options);
		instance.start();
		return instance;
	}
}

// default easing function
export function smoothStep(x: number) {
	return x * x * (3.0 - 2.0 * x);
}
