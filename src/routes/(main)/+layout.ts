import type {LayoutLoad} from './$types';

export const load = (async ({url}) => {
	return {
		wide: url.pathname.endsWith('/graph') || url.pathname.endsWith('/tabletop')
	};
}) satisfies LayoutLoad;