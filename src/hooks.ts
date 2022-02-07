import {checkUserToken, getAuthorizationToken, getCookieName} from '$lib/security';
import type {ServerLocals, UserSession} from '$lib/systemtypes';
import type {RequestEvent} from '@sveltejs/kit';
import type {MaybePromise} from "@sveltejs/kit/types/helper";
import type {ResolveOpts} from "@sveltejs/kit/types/hooks";
import cookie from 'cookie';

//const USER_PATH = "/user";
//const API_PATH = "/api";

const debug = false

//export const handle: Handle = async ({request, resolve}) => {
export async function handle({event, resolve}: {
	event: RequestEvent;
	resolve(event: RequestEvent, opts?: ResolveOpts): MaybePromise<Response>;
}) {
	if (debug) console.log(`handle ${JSON.stringify(event.url)}`)

	// just a cookie for now (and not a proper one either...)
	const cookies = cookie.parse(event.request.headers.get('cookie') || '');
	const userToken = getAuthorizationToken(event.request.headers.authorization)
		|| cookies[getCookieName()]
		|| '';
	const token = await checkUserToken(userToken);

	const locals = event.locals as ServerLocals;
	locals.email = token.email;
	locals.authenticated = token.valid;
	if (token.valid) {
		locals.userToken = userToken;
	}
	// TODO https://github.com/sveltejs/kit/issues/1046
	//if (event.url.searchParams.has('_method')) {
	//	event.request.method = event.url.searchParams.get('_method').toUpperCase();
	//}

	return resolve(event);
}

export function getSession(request: RequestEvent): MaybePromise<App.Session> {
	const locals = request.locals as ServerLocals;
	const user: UserSession = {
		email: locals.email,
		authenticated: locals.authenticated,
		token: locals.userToken
	}
	if (debug) console.log(`locals -> token ${user.token}`, locals);
	return {
		user: user
	}
}

