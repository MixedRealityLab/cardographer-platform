import {checkUserToken, getAuthorizationToken, getCookieName} from '$lib/security';
import type {GetSession, Handle} from '@sveltejs/kit';
import {parse} from "cookie";

//const USER_PATH = "/user";
//const API_PATH = "/api";

const debug = false

export const handle: Handle = async function ({event, resolve}) {
	if (debug) console.log(`handle ${JSON.stringify(event.url)}`)

	// just a cookie for now (and not a proper one either...)
	const cookies = parse(event.request.headers.get('cookie') || '');
	const userToken = getAuthorizationToken(event.request.headers.get('authorization'))
		|| cookies[getCookieName()]
		|| '';
	const token = await checkUserToken(userToken);

	const locals = event.locals
	locals.email = token.email
	locals.authenticated = token.valid
	if (token.valid) {
		locals.token = userToken;
	}
	// TODO https://github.com/sveltejs/kit/issues/1046
	//if (event.url.searchParams.has('_method')) {
	//	event.request.method = event.url.searchParams.get('_method').toUpperCase();
	//}

	return resolve(event);
}

export const getSession: GetSession = async function ({locals}) {
	if (debug) console.log(`locals -> token ${locals.token}`, locals);
	return {
		email: locals.email,
		authenticated: locals.authenticated == true,
		token: locals.token
	}
}

