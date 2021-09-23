export function getAuthHeader(session: any): RequestInit {
	const token = session.user?.token;
	if (!token) {
		console.log(`note, no user token`, session);
		return null
	}
	return {headers: {authorization: `Bearer ${token}`}}
}