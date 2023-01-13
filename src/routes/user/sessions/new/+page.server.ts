import {base} from "$app/paths";
import {getDb, getNewId} from "$lib/db"
import {verifyAuthentication} from "$lib/security"
import type {Session} from "$lib/types";
import type {Actions} from "@sveltejs/kit"
import {error, redirect} from "@sveltejs/kit";
import type {PageServerLoad} from "./$types"

export const load: PageServerLoad = async function ({locals}) {
	verifyAuthentication(locals)
	const db = await getDb();
	const sessions = await db.collection<Session>('Sessions')
		.find({
			$or: [{isPublic: true}, {owners: locals.email}], isTemplate: true
		}, {
			projection: {
				_id: true, name: true, description: true, credits: true,
				owners: true, stages: true, created: true,
				lastModified: true, isPublic: true, isTemplate: true,
				isArchived: true, sessionType: true
				// players? playerTemplates? other stuff?
			}
		})
		.sort({"name": 1, "owners[0]": 1, "created": 1})
		.toArray()
	return {
		sessions: sessions
	}
}

export const actions: Actions = {
	default: async ({locals, request}) => {
		verifyAuthentication(locals)
		const data = await request.formData()
		const oldSessionId = data.get('id') as string

		if (!oldSessionId) {
			return error(400, "Missing Session ID")
		}
		const db = await getDb();
		const newId = getNewId();
		const now = new Date().toISOString();
		// existing local session...

		let session: Session
		if (oldSessionId === 'blank') {
			session = {
				_id: newId,
				created: now,
				decks: [],
				isArchived: false,
				isPublic: false,
				isTemplate: false,
				lastModified: now,
				name: "Blank Session",
				owners: [locals.email],
				sessionType: ""
			}
		} else {
			session = await db.collection<Session>('Sessions').findOne({
				_id: oldSessionId, $or: [{isPublic: true}, {owners: locals.email}]
			})
			// check permissions
			if (!session) {
				return error(404);
			}
			session._id = newId
			session.name = `Copy of ${session.name}`
			session.created = session.lastModified = now
			session.owners = [locals.email]
			session.isPublic = false
			session.isTemplate = false
		}

		// add
		const result = await db.collection<Session>('Sessions').insertOne(session);
		if (!result.acknowledged) {
			return error(500, "Error Creating Session");
		}

		throw redirect(302, base + '/user/sessions/' + newId)
	}
}