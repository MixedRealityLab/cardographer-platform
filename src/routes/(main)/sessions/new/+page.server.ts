import {base} from "$app/paths";
import {getDb, getNewId} from "$lib/db"
import {verifyAuthentication} from "$lib/security"
import { checkSessionCredits } from "$lib/sessions";
import type {Session} from "$lib/types";
import type {Actions} from "@sveltejs/kit"
import {error, redirect} from "@sveltejs/kit";
import type {PageServerLoad} from "./$types"
import { getQuotaDetails, getUsageSessions } from "$lib/quotas";

export const load: PageServerLoad = async function ({locals}) {
	await verifyAuthentication(locals)
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
	await checkSessionCredits(sessions, db)
	const usageSessions = await getUsageSessions(locals.email)
	const quota = await getQuotaDetails(locals.email)
	return {
		sessions: sessions,
		usageSessions,
		quotaSessions: quota.quota.sessions,
	}
}

export const actions: Actions = {
	default: async ({locals, request}) => {
		await verifyAuthentication(locals)
		const usageSessions = await getUsageSessions(locals.email)
		const quota = await getQuotaDetails(locals.email)
		if (usageSessions >= quota.quota.sessions) {
			console.log(`Exceeded session quota ${usageSessions}/${quota.quota.sessions} for ${locals.email}`)
			throw error(422,"Session quota exceeded")
		}
		const data = await request.formData()
		const oldSessionId = data.get('id') as string

		if (!oldSessionId) {
			throw error(400, "Missing Session ID")
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
				sessionType: "",
				isConsentForStats: false,
				isConsentForText: false,
				isConsentForRecording: false,
				isConsentToIdentify: false,
				isConsentRequiresCredit: false,
			}
		} else {
			session = await db.collection<Session>('Sessions').findOne({
				_id: oldSessionId, $or: [{isPublic: true}, {owners: locals.email}]
			})
			// check permissions
			if (!session) {
				throw error(404);
			}
			session._id = newId
			session.name = `Copy of ${session.name}`
			session.created = session.lastModified = now
			session.owners = [locals.email]
			// used by miro
			session.url = null
			session.miroId = null
			// not completely sure about this :-) but better than clobbering uploads, etc.
			session.sessionType = ""
			session.isPublic = false
			session.isTemplate = false
			session.isConsentForStats = false
			session.isConsentForText = false
			session.isConsentForRecording = false
			session.isConsentToIdentify = false
			session.isConsentRequiresCredit = false
		}

		// add
		session.quotaUser = locals.email
		const result = await db.collection<Session>('Sessions').insertOne(session);
		if (!result.acknowledged) {
			throw error(500, "Error Creating Session");
		}

		throw redirect(302, base + '/sessions/' + newId)
	}
}