import type {LayoutLoad} from './$types';
import type {User} from '$lib/types';
import {getUser} from '$lib/userutils';
import { getDb } from '$lib/db';
import { isLocalUserDisabled } from '$lib/userutils';
import {base} from "$app/paths"
import {redirect} from "@sveltejs/kit";
import { GUEST_EMAIL } from '$lib/userutils';

const ACCESS_UPDATE_MINUTES = 5

export const load = (async ({url, locals}) => {
	let localUser : User|null = null
	if (locals.authenticated && locals.email && !(await isLocalUserDisabled(locals))) {
		const db = await getDb()
		localUser = await getUser(db, locals.email, locals.email)
		if (localUser && locals.email != GUEST_EMAIL) {
			const now = new Date()
			if (!localUser.lastAccess || now.getTime()-new Date(localUser.lastAccess).getTime() > ACCESS_UPDATE_MINUTES*60*1000) {
				await db.collection<User>("Users").updateOne({ 
					email: locals.email
				}, {
					$set: {  
						lastAccess: now.toISOString(),
					}
				})
			}
		}
		//console.log(`local user is ${locals.email}, ${localUser.isDeckBuilder ? 'deck builder' : ''}, ${localUser.isPublisher ? 'publisher' : ''}, ${localUser.isAdmin ? 'admin' : ''}`)
	}
	return {
		wide: url.pathname.endsWith('/graph') || url.pathname.endsWith('/tabletop') || url.pathname.endsWith('/summary'),
		localUser: localUser,
	};
}) satisfies LayoutLoad;