import { Slide, SlideProps } from '@calmdownval/presentation';
import React, { useMemo } from 'react';

import type { ColorGenerator } from '~/utils/ColorGenerator';

const Empty = () => null;

export interface ColorSlideProps extends Partial<SlideProps> {
	readonly generator: ColorGenerator;
}

export function ColorSlide({ generator, style, ...rest }: ColorSlideProps) {
	const color = useMemo(
		() => generator.next(),
		[ generator ]
	);

	return (
		<Slide
			component={Empty}
			{...rest}
			style={{
				...style,
				background: color
			}}
		/>
	);
}
