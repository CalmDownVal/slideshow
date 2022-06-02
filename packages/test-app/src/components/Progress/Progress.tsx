import { Progression } from '@calmdownval/slideshow';
import { h } from 'preact';

import './Progress.css';

export interface ProgressProps {
	readonly label: string;
	readonly value: number;
}

export function Progress({ label, value }: ProgressProps) {
	return (
		<div class='progress'>
			<span class='progress__label'>
				{label}
			</span>
			<div class='progress__wrapper'>
				<div class='progress__indicator' style={Progression.animate('progress-scale', value)} />
			</div>
		</div>
	);
}
