import { useReducer } from 'preact/hooks';

function flipReducer(state: boolean, _action: never) {
	return !state;
}

export function useForceUpdate() {
	return useReducer(flipReducer, false)[1] as () => void;
}
