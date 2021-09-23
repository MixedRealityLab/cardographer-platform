import jwt from 'jsonwebtoken';

interface UserToken {
	valid: boolean,
	email?: string
}

const cookieSecret = "something2";
const jwtSecret = "somethingelse";

const debug = false;

export async function checkUserToken(rawToken: string): Promise<UserToken> {
	if (!rawToken) {
		return {
			valid: false
		}
	}
	return new Promise<UserToken>((resolve, reject) => {
		jwt.verify(rawToken, jwtSecret, (err, decoded) => {
			if (err) {
				if (debug) console.log(`invalid token: ${err}`);
				resolve({valid: false});
			}
			if (!decoded.email) {
				if (debug) console.log(`jwt missing email`, decoded);
				resolve({valid: false});
			}
			if (debug) console.log(`valid token for ${decoded.email}`);
			resolve({
				valid: true,
				email: decoded.email
			});
		})
	})
}

export async function signUserToken(email: string): Promise<string> {
	const claims = {
		email: email
	}
	return jwt.sign(claims, jwtSecret);
}

export function getCookieName(): string {
	return "cardographer-" + cookieSecret;
}

export function makeTokenCookie(token: string): string {
	return `${getCookieName()}=${token}; Path=/; HttpOnly`;
}

export function getAuthorizationHeader(token: string): string {
	return `Bearer ${token}`;
}

export function getAuthorizationToken(header: string): string {
	const regex = /Bearer ([^ ]+)/;
	const match = regex.exec(header);
	if (match !== null) {
		//console.log(`authorization matches: ${match[1]}`);
		return match[1];
	}
	if (debug) console.log(`authorization not found (${header})`);
	return ''
}
	
