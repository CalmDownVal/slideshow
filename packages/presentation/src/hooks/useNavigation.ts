import { useContext } from 'react';

import type { Navigation } from '~/presentation/Navigation';
import { PresentationContext } from '~/presentation/PresentationBase';

export function useNavigation<TMeta = any>(): Navigation<TMeta> {
	const navigation = useContext(PresentationContext);
	if (navigation === null) {
		throw new Error('useNavigation can only be used within child components of a <Presentation />');
	}

	return navigation;
}
