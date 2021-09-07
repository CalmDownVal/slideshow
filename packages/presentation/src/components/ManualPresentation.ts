import { UNIT } from '~/utils/constants';

import { PresentationBase, PresentationBaseProps } from './PresentationBase';

export interface ManualPresentationProps extends PresentationBaseProps {
	readonly position: number;
}

export class ManualPresentation extends PresentationBase<ManualPresentationProps> {
	public componentDidUpdate() {
		super.componentDidUpdate();

		const { isHorizontal, position } = this;
		this.wrapper?.scrollTo(
			isHorizontal ? position : 0,
			isHorizontal ? 0 : position
		);
	}

	public render() {
		this.position = this.props.position / UNIT * this.scrollLength;
		return super.render();
	}

	public static readonly defaultProps = PresentationBase.defaultProps;
}
