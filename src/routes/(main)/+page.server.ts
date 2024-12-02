import {base} from "$app/paths";
import {getDb} from "$lib/db";
import {getCookieName, hashPassword, REGISTER_CODE, signUserToken} from "$lib/security";
import type {User} from "$lib/types";
import type {Actions} from "@sveltejs/kit";
import {fail, redirect} from "@sveltejs/kit";
import {customAlphabet} from "nanoid"
import { sendPasswordResetEmail } from "$lib/userutils";

export const actions: Actions = {
	default: async ({cookies, request, url}) => {
		const data = await request.formData();
		let email = data.get('email') as string;
		const password = data.get('password') as string;
		const register = data.get('register')
		if (!email || (!register && !password)) {
			return fail(400, {error: 'Missing data'})
		}
		email = email.toLowerCase()
		// check password
		const db = await getDb();
		const user = await db.collection<User>('Users').findOne({email: email})
		if (register && user) {
			return fail(400, {error: `That user is already registered`});
		}
		if (!register && !user) {
			return fail(401, {error: 'Login Failed'})
		}
		// register code
		if (register) {
			if (!REGISTER_CODE) {
				return fail(401, {error: 'Register Code Missing!'})
			}
			const code = data.get('code')
			if (code != REGISTER_CODE) {
				return fail(401, {error: 'Incorrect Register Code'})
			}
		}
		const nanoid = customAlphabet('useandom26T198340PX75pxJACKVERYMINDBUSHWOLFGQZbfghjklqvwyzrict', 32)
		const code = nanoid()
		const hash = await hashPassword(code)
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
			const res = await sendPasswordResetEmail(email, url)
			return res
		}
		if (!register && user.password != hash) {
			return fail(401, {error: `Login Failed`})
		}
		const token = await signUserToken(email);
		cookies.set(getCookieName(), token, {
			path: '/',
			httpOnly: true,
			sameSite: 'none',
			secure: true
		})
		throw redirect(302, base + "/decks")
	}
}