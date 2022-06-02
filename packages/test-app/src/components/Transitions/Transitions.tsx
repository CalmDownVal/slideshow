import { useProgression } from '@calmdownval/slideshow';
import { h } from 'preact';

import { Progress } from '~/components/Progress/Progress';

import './Transitions.css';

export interface TransitionsProps {
	readonly metadata?: string;
}

export function Transitions({ metadata }: TransitionsProps) {
	const progression = useProgression();
	return (
		<div class='transitions'>
			<h2 class='transitions__header'>
				{metadata}
			</h2>
			<Progress value={progression.appear} label='Appear' />
			<Progress value={progression.main} label='Main' />
			<Progress value={progression.dock} label='Dock' />
			<Progress value={progression.disappear} label='Disappear' />
		</div>
	);
}
