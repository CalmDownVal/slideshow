import { Slide, SlideshowDirection, SlideshowProvider, Viewport } from '@calmdownval/slideshow';
import { h } from 'preact';

// import { Navigation } from '~/components/Navigation/Navigation';
// import { Transitions } from '~/components/Transitions/Transitions';

const Content = ({ metadata }: { metadata?: string }) => (
	<p>{metadata}</p>
);

export function App() {
	return (
		<SlideshowProvider>
			<Viewport
				direction={SlideshowDirection.LeftToRight}
				paddingStart={0.5}
				paddingEnd={0.5}
				scrollable
			>
				{/* <Navigation /> */}
				<Slide component={Content} metadata='1' />
				<Slide component={Content} metadata='2' length={0.3} dock={0.5} />
				<Slide component={Content} metadata='3' length={0.3} dock={0.5} />
				<Slide component={Content} metadata='4' length={0.3} dock={0.5} />
				<Slide component={Content} metadata='5' />
			</Viewport>
		</SlideshowProvider>
	);
}
