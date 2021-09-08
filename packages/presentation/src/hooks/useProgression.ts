import { useContext } from 'react';

import { ProgressionContext } from '~/presentation/Slide';

export function useProgression() {
	const progression = useContext(ProgressionContext);
	if (progression === null) {
		throw new Error('useProgression can only be used within child components of a <Slide />');
	}

	return progression;
}
