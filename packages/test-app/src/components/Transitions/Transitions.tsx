import { useProgression } from '@calmdownval/presentation';
import { h } from 'preact';

import { Progress } from '~/components/Progress/Progress';

import './Transitions.css';

export interface TransitionsProps {
	readonly metadata?: string;
}

export function Transitions({ metadata }: TransitionsProps) {
	const progression = useProgression();
	return (
		<div className='transitions'>
			<h2 className='transitions__header'>
				{metadata}
			</h2>
			<Progress value={progression.appear} label='Appear' />
			<Progress value={progression.main} label='Main' />
			<Progress value={progression.dock} label='Dock' />
			<Progress value={progression.disappear} label='Disappear' />
		</div>
	);
}
