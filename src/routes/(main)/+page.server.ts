import {base} from "$app/paths";
import {getDb} from "$lib/db";
import {getCookieName, signUserToken} from "$lib/security";
import type {User} from "$lib/types";
import type {Actions} from "@sveltejs/kit";
import {fail, redirect} from "@sveltejs/kit";
import {hashPassword, REGISTER_CODE} from "../api/user/login/+server";

export const actions: Actions = {
	default: async ({cookies, request}) => {
		const data = await request.formData();
		let email = data.get('email') as string;
		const password = data.get('password') as string;
		if (!email || !password) {
			return fail(400, {error: 'Missing data'})
		}
		email = email.toLowerCase()
		// check password
		const db = await getDb();
		const user = await db.collection<User>('Users').findOne({email: email})
		const register = data.get('register')
		if (register && user) {
			return fail(400, {error: `That user is already registered`});
		}
		if (!register && !user) {
			return fail(404, {error: 'Login Failed'})
		}
		// register code
		if (register) {
			if (!REGISTER_CODE) {
				return fail(404, {error: 'Register Code Missing!'})
			}
			const code = data.get('code')
			if (code != REGISTER_CODE) {
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
				return fail(500)
			}
		}
		if (!register && user.password != hash) {
			return fail(404, {error: `login failure for ${email}`})
		}
		const token = await signUserToken(email);
		cookies.set(getCookieName(), token, {
			path: '/',
			httpOnly: true
		})
		throw redirect(302, base + "/user/decks")
	}
}