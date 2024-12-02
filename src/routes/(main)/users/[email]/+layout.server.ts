import {getDb} from "$lib/db";
import {getUser} from "$lib/userutils";
import {verifyAuthentication} from "$lib/security";
import type {LayoutServerLoad} from "./$types"

export const load: LayoutServerLoad = async function ({locals, params}) {
	verifyAuthentication(locals)
	const {email} = params;
	const db = await getDb();
	const user = await getUser(db, email, locals.email)
	return {
		user: user
	}
}
