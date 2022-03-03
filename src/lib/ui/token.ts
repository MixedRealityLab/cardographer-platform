import {base} from "$app/paths";
import type {LoadOutput} from "@sveltejs/kit";

export function authenticateRequest(session: any, request: RequestInit = {}): RequestInit {
	const token = session.token;
	if (!token) {
		console.log(`note, no user token`, session);
	} else if (request.headers) {
		request.headers['authorization'] = `Bearer ${token}`
	} else {
		request.headers = {authorization: `Bearer ${token}`}
	}
	return request
}

export function errorResponses(responses: Response[]): LoadOutput {
	const res = responses.find((res) => !res.ok)
	return errorResponse(res)
}

export function errorResponse(res: Response): LoadOutput {
	console.log(res)
	if (res.status === 401) {
		return {
			status: 301,
			redirect: `${base}/`
		}
	} else {
		return {
			status: res.status,
			error: new Error(`${res.statusText}: Could not load ${res.url}`)
		}
	}
}