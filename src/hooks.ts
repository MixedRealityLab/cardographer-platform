import cookie from 'cookie';
import { v4 as uuid } from '@lukeed/uuid';
import type { Handle, GetSession } from '@sveltejs/kit';
import type { UserSession, ServerLocals } from '$lib/systemtypes.ts';
import { checkUserToken, getCookieName, getAuthorizationToken } from '$lib/security.ts';

const USER_PATH = "/user";
const API_PATH = "/api";

export const handle: Handle = async ({ request, render }) => {

	console.log(`handle ${request.path}`, request.headers)

	// just a cookie for now (and not a proper one either...)
	const cookies = cookie.parse(request.headers.cookie || '');
	const userToken = getAuthorizationToken(request.headers.authorization)
		|| cookies[getCookieName()] 
		|| '';
	const token = await checkUserToken(userToken);

	let locals = request.locals as ServerLocals;
	locals.email = token.email;
	locals.authenticated = token.valid;
        if (token.valid) {
		locals.userToken = userToken;
	}
	// TODO https://github.com/sveltejs/kit/issues/1046
	if (request.query.has('_method')) {
		request.method = request.query.get('_method').toUpperCase();
	}

	const response = await render(request);

	//response.headers['set-cookie'] = `userid=${request.locals.userid}; Path=/; HttpOnly`;

	return response;
};

export const getSession : GetSession = (request) => {
	let locals = request.locals as ServerLocals;
	const user: UserSession = {
		email: locals.email,
		authenticated: locals.authenticated,
		token: locals.userToken
	}
	console.log(`locals -> token ${user.token}`, locals);
	return {
		user: user
	}
}

