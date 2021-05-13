import type {RequestHandler} from '@sveltejs/kit';
import type {LoginRequest,LoginResponse} from '$lib/apitypes.ts';
import {signUserToken, makeTokenCookie} from '$lib/security.ts';

export async function post(request): RequestHandler {
	// TODO security!
	const login = request.body as LoginRequest;
	if (!login.email) {
		return {
			status: 400
		}
	}
	const token = await signUserToken(login.email);
	const ok:LoginResponse = {
		token: token
	};
	console.log(`login ${login.email}: ${token}`);
	// as cookie (for now)
	return {
		status: 200,
		headers: {
			'set-cookie': makeTokenCookie(token)
		},
		body: ok
	}
}
