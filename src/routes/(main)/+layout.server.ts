import type {LayoutLoad} from './$types';
import type {User} from '$lib/types';
import {getUser} from '$lib/userutils';
import { getDb } from '$lib/db';

export const load = (async ({url, locals}) => {
	let user : User|null = null
	if (locals.authenticated && locals.email) {
		const db = await getDb()
		user = getUser(db, locals.email, locals.email)
	}
	return {
		wide: url.pathname.endsWith('/graph') || url.pathname.endsWith('/tabletop') || url.pathname.endsWith('/summary'),
		user: user,
	};
}) satisfies LayoutLoad;