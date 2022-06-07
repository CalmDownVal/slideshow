import { Slide, SlideshowDirection, SlideshowProvider, Viewport } from '@calmdownval/slideshow';
import { h } from 'preact';

import { Navigation } from '~/components/Navigation/Navigation';
import { Transitions } from '~/components/Transitions/Transitions';

export const App = () => (
	<SlideshowProvider>
		<Navigation />
		<Viewport
			direction={SlideshowDirection.Row}
			paddingStart={0.25}
			paddingEnd={0.25}
			scrollable
		>
			<Slide
				content={Transitions}
				length={0.5}
				dock={1}
				metadata={{
					no: 1,
					title: 'First'
				}}
			/>
			<Slide
				content={Transitions}
				length={0.5}
				dock={1}
				metadata={{
					no: 2,
					title: 'Second'
				}}
			/>
			<Slide
				content={Transitions}
				length={0.5}
				dock={1}
				metadata={{
					no: 3,
					title: 'Third'
				}}
			/>
			<Slide
				content={Transitions}
				length={0.5}
				dock={1}
				metadata={{
					no: 4,
					title: 'Fourth'
				}}
			/>
			<Slide
				content={Transitions}
				length={0.5}
				dock={1}
				metadata={{
					no: 5,
					title: 'Fifth'
				}}
			/>
		</Viewport>
	</SlideshowProvider>
);
