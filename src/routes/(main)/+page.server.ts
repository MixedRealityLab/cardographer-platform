import {getDb} from "$lib/db";
import {getCookieName, makeTokenCookie, signUserToken} from "$lib/security";
import type {User} from "$lib/types";
import {fail, redirect} from "@sveltejs/kit";
import type {Actions} from "@sveltejs/kit";
import {hashPassword, REGISTER_CODE} from "./api/user/login/+server";

const debug = true

export const actions: Actions = {
	default: async ({cookies, request}) => {
		const data = await request.formData();
		let email = data.get('email') as string;
		const password = data.get('password') as string;
		if (!email || !password) {
			if (debug) console.log(`Missing data ${email} or ${password}`);
			return fail(400, {error: 'Missing data'})
		}
		email = email.toLowerCase()
		// check password
		const db = await getDb();
		const user = await db.collection<User>('Users').findOne({email: email})
		const register = data.get('register')
		if (register && user) {
			if (debug) console.log(`register existing user ${email}`);
			return fail(400, {error: `That user is already registered`});
		}
		if (!register && !user) {
			if (debug) console.log(`login user not found: ${email}`);
			return fail(404)
		}
		// register code
		if (register) {
			if (!REGISTER_CODE) {
				console.log(`Error: registration code is not set (REGISTER_CODE)`);
				return fail(404, {error: 'Register Code Missing!'})
			}
			const code = data.get('code')
			if (code != REGISTER_CODE) {
				if (debug) console.log(`register code ${REGISTER_CODE}`);
				if (debug) console.log(`invalid registration code`);
				return fail(404, {error: 'Incorrect Register Code'})
			}
		}
		const hash = await hashPassword(password)
		if (register) {
			const name = data.get('name') as string
			const user: User = {
				name: name,
				email: email,
				password: hash,
				disabled: false,
				created: new Date().toISOString(),
			}
			const ar = await db.collection<User>('Users').insertOne(user);
			if (!ar.insertedId) {
				if (debug) console.log(`unable to add user ${email}`);
				return fail(500)
			}
			console.log(`added user ${email}`);
		}
		if (!register && user.password != hash) {
			if (debug) console.log(`login failure for ${email}`);
			return fail(404)
		}
		const token = await signUserToken(email);
		console.log(`login ${email}`); // ${token}
		cookies.set(getCookieName(), token, {
			path: '/',
			httpOnly: true
		})
		throw redirect(302, "")
	}
}