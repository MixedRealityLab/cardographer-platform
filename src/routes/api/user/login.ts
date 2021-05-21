import type {RequestHandler} from '@sveltejs/kit';
import type {LoginRequest,LoginResponse} from '$lib/apitypes.ts';
import {signUserToken, makeTokenCookie} from '$lib/security.ts';
import {getDb} from '$lib/db.ts';
import {scrypt} from 'crypto';

const debug = true;

// from .env
export const REGISTER_CODE = process.env['REGISTER_CODE'];

export async function post(request): RequestHandler {
	const login = request.body as LoginRequest;
	if (!login.email || !login.password) {
		return {
			status: 400
		}
	}
	// check password
	const db = await getDb();
	const user = await db.collection('Users').findOne({email:login.email}) as User;
	if (login.register && user) {
		if (debug) console.log(`register existing user ${login.email}`);
		return { body: { error: `That user is already registered` } };
	}
	if (!login.register && !user) {
		if (debug) console.log(`login user not found: ${login.email}`);
		return { status: 404 }
	}
	// register code
	if (login.register) {
		if (!REGISTER_CODE) {
			console.log(`Error: registration code is not set (REGISTER_CODE)`);
			return {status: 404}
		}
		if (login.code != REGISTER_CODE) {
			if (debug) console.log(`register code ${REGISTER_CODE}`);
			if (debug) console.log(`invalid registration code`);
			return { status: 404 }
		}
	}
	const hash = await hashPassword(login.password);
	if (login.register) {
		const user:User = {
			email: login.email,
			password: hash,
			disabled: false,
			created: new Date().toISOString(),
		}
		const ar = await db.collection('Users').insertOne(user);
		if (!ar.insertedCount) {
			if (debug) console.log(`unable to add user ${login.email}`);
			return { status: 500 };
		}
		console.log(`added user ${login.email}`);
	}
	if (!login.register && user.password != hash) {
		if (debug) console.log(`login failure for ${login.email}`);
		return { status: 404 }
	}
	const token = await signUserToken(login.email);
	const ok:LoginResponse = {
		token: token
	};
	console.log(`login ${login.email}`); // ${token}
	// as cookie (for now)
	return {
		status: 200,
		headers: {
			'set-cookie': makeTokenCookie(token)
		},
		body: ok
	}
}
async function hashPassword(password:string) : string {
	return new Promise<string>((resolve,reject) => {
		scrypt(password, "90oisa", 64, (err, derivedKey) => {
			if (err) reject(err);
			else resolve(derivedKey);
		});
	});
}
