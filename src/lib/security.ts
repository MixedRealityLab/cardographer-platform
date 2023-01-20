import {base} from "$app/paths";
import {error, redirect} from "@sveltejs/kit";
import {scrypt} from "crypto";
import jwt from 'jsonwebtoken';

const {sign, verify} = jwt;


interface UserToken {
	valid: boolean,
	email?: string
}

const cookieSecret = "something2";
const jwtSecret = "somethingelse";

const debug = false;

export const REGISTER_CODE = process.env['REGISTER_CODE'];

export async function hashPassword(password: string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		scrypt(password, "90oisa", 32, (err, derivedKey) => {
			if (err) reject(err);
			else resolve(derivedKey.toString('hex'));
		});
	});
}

export function verifyAuthentication(locals: App.Locals, shouldRedirect: boolean = true) {
	if (!locals.authenticated) {
		if (shouldRedirect) {
			throw redirect(302, base + "/")
		} else {
			throw error(401, "Authentication Required")
		}
	}
}

export async function checkUserToken(rawToken: string): Promise<UserToken> {
	if (!rawToken) {
		return {
			valid: false
		}
	}
	return new Promise<UserToken>((resolve) => {
		verify(rawToken, jwtSecret, (err, decoded) => {
			if (err) {
				if (debug) console.log(`invalid token: ${err}`);
				resolve({valid: false});
			}
			if (!decoded['email']) {
				if (debug) console.log(`jwt missing email`, decoded);
				resolve({valid: false});
			}
			if (debug) console.log(`valid token for ${decoded['email']}`);
			resolve({
				valid: true,
				email: decoded['email']
			});
		})
	})
}

export async function signUserToken(email: string): Promise<string> {
	const claims = {
		email: email
	}
	return sign(claims, jwtSecret);
}

export function getCookieName(): string {
	return "cardographer-" + cookieSecret;
}

export function makeTokenCookie(token: string): string {
	return `${getCookieName()}=${token}; Path=/; HttpOnly`;
}