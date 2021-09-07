import { createContext, useContext } from 'react';

import type { PresentationBase } from '~/components/PresentationBase';

export class Navigation {
	public constructor(
		/** @internal */
		public readonly presentation: PresentationBase
	) {}
}

export const NavigationContext = createContext<Navigation | null>(null);

export function useNavigation() {
	const navigation = useContext(NavigationContext);
	if (navigation === null) {
		throw new Error('useNavigation can only be used within child components of a <Presentation />');
	}

	return navigation;
}
