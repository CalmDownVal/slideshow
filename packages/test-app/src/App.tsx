import { Slide, SlideshowDirection, SlideshowProvider, Viewport } from '@calmdownval/slideshow';
import { h } from 'preact';

import { Navigation } from '~/components/Navigation/Navigation';
// import { Transitions } from '~/components/Transitions/Transitions';

const Content = ({ metadata }: { metadata?: string }) => (
	<p>{metadata}</p>
);

export function App() {
	return (
		<SlideshowProvider>
			<Navigation />
			<Viewport
				direction={SlideshowDirection.Row}
				paddingStart={0.25}
				paddingEnd={0.25}
				scrollable
			>
				<Slide component={Content} metadata='1' length={0.5} dock={1} />
				<Slide component={Content} metadata='2' length={0.5} dock={1} />
				<Slide component={Content} metadata='3' length={0.5} dock={1} />
				<Slide component={Content} metadata='4' length={0.5} dock={1} />
				<Slide component={Content} metadata='5' length={0.5} dock={1} />
			</Viewport>
		</SlideshowProvider>
	);
}
