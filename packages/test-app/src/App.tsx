import { Slide, SlideshowDirection, SlideshowProvider, Viewport } from '@calmdownval/slideshow';
import { h } from 'preact';
// import { useEffect, useState } from 'preact/hooks';

import { Navigation } from '~/components/Navigation/Navigation';
import { Transitions } from '~/components/Transitions/Transitions';

export function App() {
	// const [ position, setPosition ] = useState(0);
	// useEffect(() => {
	// 	const handle = setInterval(() => {
	// 		setPosition(Math.random());
	// 	}, 1000);

	// 	return () => clearInterval(handle);
	// });

	return (
		<SlideshowProvider>
			<Navigation />
			<Viewport
				// position={position}
				direction={SlideshowDirection.Row}
				paddingStart={0.25}
				paddingEnd={0.25}
				scrollable
			>
				<Slide component={Transitions} metadata='1' length={0.5} dock={1} />
				<Slide component={Transitions} metadata='2' length={0.5} dock={1} />
				<Slide component={Transitions} metadata='3' length={0.5} dock={1} />
				<Slide component={Transitions} metadata='4' length={0.5} dock={1} />
				<Slide component={Transitions} metadata='5' length={0.5} dock={1} />
			</Viewport>
		</SlideshowProvider>
	);
}
