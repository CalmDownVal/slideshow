import { ScrollPresentation } from '@calmdownval/presentation';
import React from 'react';

import { ColorSlide } from '~/components/ColorSlide';
import { ColorGenerator } from '~/utils/ColorGenerator';

const generator = new ColorGenerator();

export function App() {
	return (
		<>
			<ScrollPresentation>
				<ColorSlide generator={generator} />
				<ColorSlide generator={generator} length={0.3} dock={0.5} />
				<ColorSlide generator={generator} length={0.3} dock={0.5} />
				<ColorSlide generator={generator} length={0.3} dock={0.5} />
				<ColorSlide generator={generator} />
			</ScrollPresentation>
		</>
	);
}
