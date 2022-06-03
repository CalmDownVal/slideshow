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
				direction={SlideshowDirection.Column}
				paddingStart={0.5}
				paddingEnd={0.5}
				scrollable
			>
				<Slide component={Content} metadata='1' />
				<Slide component={Content} metadata='2' length={1} dock={0.5} />
				<Slide component={Content} metadata='3' length={1} dock={0.5} />
				<Slide component={Content} metadata='4' length={1} dock={0.5} />
				<Slide component={Content} metadata='5' />
			</Viewport>
		</SlideshowProvider>
	);
}
