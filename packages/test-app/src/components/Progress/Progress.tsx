import { h } from 'preact';

import './Progress.css';

export interface ProgressProps {
	readonly label: string;
	readonly value: number;
}

export const Progress = ({ label, value }: ProgressProps) => (
	<div class='progress'>
		<div class='progress__wrapper'>
			<div class='progress__indicator' style={{ animationDelay: `-${value}s` }} />
		</div>
		<span class='progress__label'>
			{label}
		</span>
	</div>
);
