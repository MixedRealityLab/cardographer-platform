import {getDb, getNewId} from "$lib/db"
import {getCookieName, hashPassword, signUserToken, verifyAuthentication} from "$lib/security"
import type {CardDeckRevision, Session, User} from "$lib/types"
import type {Actions} from "@sveltejs/kit"
import {fail} from "@sveltejs/kit"
import type {PageServerLoad} from "./$types";

export const load = (async ({locals, params}) => {
	if (!locals.authenticated) {
		return {authenticated: false}
	}
	const db = await getDb();
	const url = "https://miro.com/app/board/" + params.id
	const session = await db.collection<Session>('Sessions').findOne({
		$or: [{owners: locals.email}, {isPublic: true}], url: url
	})

	if (!session) {
		const sessions = await db.collection<Session>('Sessions')
			.find({owners: locals.email, url: null, isArchived: false})
			.sort({"lastModified": -1, "name": 1, "owners[0]": 1, "created": 1, "_id": 1})
			.project({"name": 1, "description": 1, "credits": 1, isPublic: 1, isTemplate: 1})
			.toArray()

		return {
			authenticated: true,
			sessions: sessions
		}
	} else {
		const deckIds = session.decks.map((deck) => deck.deckId + ':' + deck.revision)
		session.decks = await db.collection<CardDeckRevision>('CardDeckRevisions')
			.find({"_id": {$in: deckIds}})
			.toArray()
		return {
			authenticated: true,
			session: session
		}
	}
}) satisfies PageServerLoad;

export const actions: Actions = {
	login: async ({cookies, request}) => {
		const data = await request.formData();
		let email = data.get('email') as string;
		const password = data.get('password') as string;
		if (!email || !password) {
			return fail(400, {error: 'Missing data'})
		}
		email = email.toLowerCase()
		const hash = await hashPassword(password)
		// check password
		const db = await getDb()
		const user = await db.collection<User>('Users').findOne({email: email, password: hash})
		if (!user) {
			return fail(401, {error: 'Login Failed'})
		}
		const token = await signUserToken(email);
		cookies.set(getCookieName(), token, {
			path: '/',
			httpOnly: true,
			sameSite: 'none',
			secure: true
		})
		return {success: true}
	},
	select: async ({locals, params, request}) => {
		verifyAuthentication(locals)
		const data = await request.formData()
		const id = data.get('id') as string
		const url = "https://miro.com/app/board/" + params.id
		const db = await getDb()
		if (!id) {
			const now = new Date().toISOString()
			const insertResult = await db.collection<Session>('Sessions').insertOne({
				_id: getNewId(),
				name: 'Miro Session',
				description: "Session for Miro board at " + url,
				owners: [locals.email],
				url: url,
				created: now,
				isPublic: false,
				lastModified: now,
				isTemplate: false,
				isArchived: false,
				sessionType: 'miro',
				decks: []
			})
			if (!insertResult.acknowledged) {
				return fail(500)
			}
		} else {
			const updateResult = await db.collection<Session>('Sessions').updateOne({
				$or: [{owners: locals.email}, {isPublic: true}], _id: id
			}, {
				$set: {
					url: url
				}
			})
			if (!updateResult.modifiedCount) {
				return fail(404)
			}
		}

		return {success: true}
	},
	unselect: async ({locals, request}) => {
		verifyAuthentication(locals)
		const data = await request.formData()
		const id = data.get('id') as string
		if (!id) {
			return fail(400, {error: 'Missing data'})
		}
		const db = await getDb()
		const updateResult = await db.collection<Session>('Sessions').updateOne({
			$or: [{owners: locals.email}, {isPublic: true}], _id: id
		}, {
			$set: {
				url: null
			}
		})
		if (!updateResult.modifiedCount) {
			return fail(404)
		}

		return {success: true}
	}
}