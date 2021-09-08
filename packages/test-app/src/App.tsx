import { ScrollPresentation, Slide } from '@calmdownval/presentation';
import React from 'react';

import { Transitions } from '~/components/Transitions/Transitions';

export function App() {
	return (
		<>
			<ScrollPresentation>
				<Slide component={Transitions} metadata='1' />
				<Slide component={Transitions} metadata='2' length={0.3} dock={0.5} />
				<Slide component={Transitions} metadata='3' length={0.3} dock={0.5} />
				<Slide component={Transitions} metadata='4' length={0.3} dock={0.5} />
				<Slide component={Transitions} metadata='5' />
			</ScrollPresentation>
		</>
	);
}
