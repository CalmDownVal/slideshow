import { Progression } from '@calmdownval/presentation';
import React from 'react';

import './Progress.css';

export interface ProgressProps {
	readonly label: string;
	readonly value: number;
}

export function Progress({ label, value }: ProgressProps) {
	return (
		<div className='progress'>
			{label}
			<div className='progress__wrapper'>
				<div className='progress__indicator' style={Progression.animate('progress-scale', value)} />
			</div>
		</div>
	);
}
