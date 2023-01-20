import type {LoginRequest} from '$lib/apitypes';
import {getDb} from '$lib/db';
import {hashPassword, makeTokenCookie, signUserToken} from '$lib/security';
import type {User} from "$lib/types";
import type {RequestHandler} from '@sveltejs/kit';
import {error, json} from '@sveltejs/kit';

export const POST: RequestHandler = async function ({request}) {
	const login = await request.json() as LoginRequest;
	if (!login.email || !login.password) {
		throw error(400, "Login Failed")
	}
	login.email = login.email.toLowerCase()
	// check password
	const db = await getDb();
	const user = await db.collection<User>('Users').findOne({email: login.email})
	if (!user) {
		throw error(401, "Login Failed")
	}
	const hash = await hashPassword(login.password)
	if (user.password != hash) {
		throw error(401, "Login Failed")
	}
	const token = await signUserToken(login.email);
	// as cookie (for now)
	return json({token: token}, {
		headers: {
			'set-cookie': makeTokenCookie(token)
		}
	})
}