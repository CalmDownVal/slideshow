export class ColorGenerator {
	private increment = 720;
	private offset = 360;

	public next() {
		const color = `hsl(${Math.round(this.offset % 360)}, 80%, 50%)`;

		this.offset += this.increment;
		if (360 - this.offset <= Number.EPSILON) {
			this.increment /= 2;
			this.offset = this.increment / 2;
		}

		return color;
	}
}
