import { useProgression } from '@calmdownval/presentation';
import React from 'react';

import { Progress } from '~/components/Progress/Progress';

export interface TransitionsProps {
	readonly metadata?: string;
}

export function Transitions({ metadata }: TransitionsProps) {
	const progression = useProgression();
	return (
		<>
			<h2>
				{metadata}
			</h2>
			<Progress value={progression.appear} label='Appear' />
			<Progress value={progression.main} label='Main' />
			<Progress value={progression.dock} label='Dock' />
			<Progress value={progression.disappear} label='Disappear' />
		</>
	);
}
