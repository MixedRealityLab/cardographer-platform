import { MiroClient } from "$lib/clients/miro"
import {getDb, getNewId} from "$lib/db"
import {getCookieName, hashPassword, signUserToken, verifyAuthentication} from "$lib/security"
import type {CardDeckRevision, Session, User} from "$lib/types"
import type {Actions} from "@sveltejs/kit"
import {fail} from "@sveltejs/kit"
import type {PageServerLoad} from "./$types";

const debug = false

export const load = (async ({locals, params}) => {
	if (!locals.authenticated) {
		if (debug) console.log(`miro not authenticated`)
		return {authenticated: false}
	}
	const db = await getDb();
	const url = "https://miro.com/app/board/" + params.id
	const session = await db.collection<Session>('Sessions').findOne({
		url: url, sessionType: 'miro', // worry about permissions later
	})

	if (!session) {
		// Not actively linked to a board, and unused, or related to this board
		const sessions = await db.collection<Session>('Sessions')
			.find({owners: locals.email, url: null, $or:[{sessionType: ''},{sessionType:'miro',miroId:params.id}], isArchived: false})
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
		session.decks.forEach((deck) => deck.cards.forEach((card) => { card.imageDpi = card.imageDpi || deck.imageDpi }))
		return {
			authenticated: true,
			session: session,
			readonly: !session.owners.includes(locals.email)
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
		if (debug) console.log(`miro logged in and set cookie for ${email}`)
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
				name: 'Miro board '+params.id,
				description: "Session for Miro board at " + url,
				owners: [locals.email],
				url: url,
				miroDuplicateUrl: null,
				miroId: params.id,
				created: now,
				isPublic: false,
				lastModified: now,
				isTemplate: false,
				isArchived: false,
				sessionType: 'miro',
				decks: [],
				isConsentForStats: false,
				isConsentForText: false,
				isConsentForRecording: false,
				isConsentToIdentify: false,
				isConsentRequiresCredit: false,
			})
			if (!insertResult.acknowledged) {
				return fail(500)
			}
		} else {
			const updateResult = await db.collection<Session>('Sessions').updateOne({
				owners: locals.email, _id: id
			}, {
				$set: {
					url: url,
					miroDuplicateUrl: null,
					sessionType: 'miro',
					miroId: params.id,
				}
			})
			if (!updateResult.modifiedCount) {
				return fail(404)
			}
		}

		return {success: true}
	},
	unselect: async ({locals, params, request}) => {
		verifyAuthentication(locals)
		const data = await request.formData()
		const id = data.get('id') as string
		if (!id) {
			return fail(400, {error: 'Missing data'})
		}
		const db = await getDb()
		const updateResult = await db.collection<Session>('Sessions').updateOne({
			owners: locals.email, _id: id
		}, {
			$set: {
				url: null,
				// backward compatibility - may not have been set on old linked sessions
				sessionType: 'miro',
				miroId: params.id,
			}
		})
		if (!updateResult.modifiedCount) {
			return fail(404)
		}

		return {success: true}
	}
}