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