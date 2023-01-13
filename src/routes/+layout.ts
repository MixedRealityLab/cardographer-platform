import type { LayoutLoad } from '../../.svelte-kit/types/src/routes';

export const load = (async ({url}) => {
	return {
		wide: url.pathname.endsWith('/graph') || url.pathname.endsWith('/tabletop')
	};
}) satisfies LayoutLoad;