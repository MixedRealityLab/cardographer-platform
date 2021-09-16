import {makeTokenCookie} from '$lib/security';
import type {EndpointOutput} from '@sveltejs/kit';

export async function post(): Promise<EndpointOutput> {
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
