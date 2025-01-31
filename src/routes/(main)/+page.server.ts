import {base} from "$app/paths";
import {getDb} from "$lib/db";
import {getCookieName, hashPassword, REGISTER_CODE, signUserToken} from "$lib/security";
import type {User} from "$lib/types";
import {GUEST_EMAIL, sendPasswordResetEmail} from "$lib/userutils";
import type {Actions} from "@sveltejs/kit";
import {fail, redirect} from "@sveltejs/kit";
import {customAlphabet} from "nanoid"
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = (async ({}) => {
	const needCodeToRegister = !!REGISTER_CODE
	return {
		needCodeToRegister,
	}
})

export const actions: Actions = {
	login: async ({cookies, request, url}) => {
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
		let user: User = await db.collection<User>('Users').findOne({email: email})
		const now = new Date().toISOString()
		// register code
		if (register) {
			if (!!REGISTER_CODE) {
				const code = data.get('code')
				if (code != REGISTER_CODE) {
					console.log(`Error: attempt to register with wrong code for ${email}`)
					return fail(401, {error: 'Incorrect Register Code'})
				}
			}
			if (!!user) {
				return fail(400, {error: `That user is already registered`});
			}
			const nanoid = customAlphabet('useandom26T198340PX75pxJACKVERYMINDBUSHWOLFGQZbfghjklqvwyzrict', 32)
			const hash = nanoid()
			const name = data.get('name') as string
			user = {
				name: name,
				email: email,
				password: hash,
				disabled: false,
				created: now,
				isNew: true,
			}
			const ar = await db.collection<User>('Users').insertOne(user);
			if (!ar.insertedId) {
				return fail(500)
			}
			console.log(`Registered new user ${email} - pending email confirmation`)
			return await sendPasswordResetEmail(email, url)
		} else {
			if (!user) {
				console.log(`Login failed unknown user ${email}`)
				return fail(401, {error: 'Login Failed'})
			}
			if (user.disabled) {
				console.log(`Login rejected for disabled user ${email}`)
				return fail(401, {error: 'This accound is disabled'})
			}
			const hash = await hashPassword(password)
			if (user.password != hash) {
				console.log(`Login failed for user ${email}`)
				await db.collection<User>("Users").updateOne({
					email: email
				}, {
					$set: {
						lastLoginFailure: now,
						countLoginFailure: user.countLoginFailure ? user.countLoginFailure + 1 : 1,
					}
				})
				return fail(401, {error: `Login Failed`})
			}
			await db.collection<User>("Users").updateOne({
				email: email
			}, {
				$set: {
					lastLogin: now,
					lastAccess: now,
					countLoginFailure: 0,
				}
			})
			const token = await signUserToken(email);
			cookies.set(getCookieName(), token, {
				path: '/',
				httpOnly: true,
				sameSite: 'none',
				secure: true
			})
			console.log(`Login success for ${email}`)
			throw redirect(302, base + "/decks")
		}
	},
	continueAsGuest: async ({cookies}) => {
		const token = await signUserToken(GUEST_EMAIL);
		cookies.set(getCookieName(), token, {
			path: '/',
			httpOnly: true,
			sameSite: 'none',
			secure: true
		})
		console.log(`Login as guest`)
		throw redirect(302, base + "/decks")
	}
}