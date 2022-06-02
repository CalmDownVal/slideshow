import { h, render } from 'preact';

import { App } from './App';

import '@calmdownval/slideshow/style.css';
import './style.css';

render(
	<App />,
	document.getElementById('root')!
);
