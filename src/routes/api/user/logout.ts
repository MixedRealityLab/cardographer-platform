import type {RequestHandler} from '@sveltejs/kit';
import {makeTokenCookie} from '$lib/security.ts';

export async function post(request): RequestHandler {
	console.log(`logout`);
	// as cookie (for now)
	return {
		status: 200,
		headers: {
			'set-cookie': makeTokenCookie('')
		},
		body: {}
	}
}
