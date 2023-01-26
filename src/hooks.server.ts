import {checkUserToken, getCookieName} from '$lib/security';
import type {Handle, RequestEvent} from '@sveltejs/kit';
import {parse} from "cookie";

const debug = false

export const handle: Handle = async function ({event, resolve}) {
	if (debug) console.log(`Handle Request: ${JSON.stringify(event.url)}`)

	// just a cookie for now (and not a proper one either...)
	const cookies = parse(event.request.headers.get('cookie') || '');
	const userToken = cookies[getCookieName()] || getAuthHeader(event) || '';
	const token = await checkUserToken(userToken);

	const locals = event.locals
	locals.email = token.email
	locals.authenticated = token.valid
	if (token.valid) {
		locals.token = userToken;
	}

	return resolve(event);
}

function getAuthHeader(event: RequestEvent): string {
	const header = event.request.headers.get('authorization')
	if (header) {
		return header.replace(/^Bearer\s/, '')
	} else {
		return null
	}
}