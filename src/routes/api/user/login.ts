import type {RequestHandler} from '@sveltejs/kit';
import type {LoginRequest,LoginResponse} from '$lib/apitypes.ts';
import {signUserToken, makeTokenCookie} from '$lib/security.ts';
import {getDb} from '$lib/db.ts';

const debug = true;

export async function post(request): RequestHandler {
	const login = request.body as LoginRequest;
	if (!login.email || !login.password) {
		return {
			status: 400
		}
	}
	// check password
	const db = await getDb();
	const user = await db.collection('Users').findOne({email:login.email}) as User;
	if (!user) {
		if (debug) console.log(`login user not found: ${login.email}`);
		return { status: 404 }
	}
	// TODO hash
	if (user.password != login.password) {
		if (debug) console.log(`login failure for ${login.email}`);
		return { status: 404 }
	}
	const token = await signUserToken(login.email);
	const ok:LoginResponse = {
		token: token
	};
	console.log(`login ${login.email}`); // ${token}
	// as cookie (for now)
	return {
		status: 200,
		headers: {
			'set-cookie': makeTokenCookie(token)
		},
		body: ok
	}
}
