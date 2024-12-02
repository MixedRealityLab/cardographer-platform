import type {LayoutLoad} from './$types';
import type {User} from '$lib/types';
import {getUser} from '$lib/userutils';
import { getDb } from '$lib/db';

export const load = (async ({url, locals}) => {
	let localUser : User|null = null
	if (locals.authenticated && locals.email) {
		const db = await getDb()
		localUser = await getUser(db, locals.email, locals.email)
		//console.log(`local user is ${locals.email}, ${localUser.isDeckBuilder ? 'deck builder' : ''}, ${localUser.isPublisher ? 'publisher' : ''}, ${localUser.isAdmin ? 'admin' : ''}`)
	}
	return {
		wide: url.pathname.endsWith('/graph') || url.pathname.endsWith('/tabletop') || url.pathname.endsWith('/summary'),
		localUser: localUser,
	};
}) satisfies LayoutLoad;