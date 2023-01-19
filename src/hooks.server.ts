import {checkUserToken, getCookieName} from '$lib/security';
import type {Handle} from '@sveltejs/kit';
import {parse} from "cookie";

//const USER_PATH = "/user";
//const API_PATH = "/api";

const debug = true

export const handle: Handle = async function ({event, resolve}) {
	if (debug) console.log(`handle ${JSON.stringify(event.url)}`)

	// just a cookie for now (and not a proper one either...)
	const cookies = parse(event.request.headers.get('cookie') || '');
	const userToken = cookies[getCookieName()]		|| '';
	const token = await checkUserToken(userToken);

	const locals = event.locals
	locals.email = token.email
	locals.authenticated = token.valid
	if (token.valid) {
		locals.token = userToken;
	}

	return resolve(event);
}