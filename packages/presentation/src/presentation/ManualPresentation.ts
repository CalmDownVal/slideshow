import { PresentationBase, PresentationBaseProps } from './PresentationBase';

export interface ManualPresentationProps extends PresentationBaseProps {
	readonly position: number;
}

export class ManualPresentation extends PresentationBase<ManualPresentationProps> {
	public shouldComponentUpdate(next: ManualPresentationProps) {
		const { position } = next;
		if (position !== this.props.position) {
			this.setPosition(position);

			const { isHorizontal } = this;
			this.viewport?.scrollTo(
				isHorizontal ? this.viewportSize * position : 0,
				isHorizontal ? 0 : this.viewportSize * position
			);
		}

		return super.shouldComponentUpdate(next);
	}

	public scrollTo() {
		// no-op
	}

	public static readonly defaultProps = PresentationBase.defaultProps;
}
