import {getDb} from '$lib/db'
import {isNotAuthenticated} from "$lib/security";
import type {User} from '$lib/types'
import type {RequestHandler} from '@sveltejs/kit'

const debug = false;

export const get: RequestHandler = async function ({locals}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	if (debug) console.log(`get sessions`);
	const db = await getDb();
	const users = await db.collection<User>('Users').find({}).project({_id: false, name: true, email: true}).toArray()
	return {
		body: {
			values: users
		}
	}
}
