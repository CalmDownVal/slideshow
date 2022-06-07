import { SlideContentProps, useProgression } from '@calmdownval/slideshow';
import { h } from 'preact';

import { Progress } from '~/components/Progress/Progress';
import type { SlideMetadata } from '~/types';

import './Transitions.css';

export type TransitionsProps = SlideContentProps<SlideMetadata>;

export const Transitions = ({ metadata }: TransitionsProps) => {
	const progression = useProgression();
	return (
		<div class='transitions'>
			<h2 class='transitions__header'>
				{metadata?.no}
			</h2>
			<div class='transitions__list'>
				<Progress value={progression.main} label='main' />
				<Progress value={progression.dock} label='dock' />
				<Progress value={progression.enter} label='enter' />
				<Progress value={progression.leave} label='leave' />
			</div>
		</div>
	);
};
