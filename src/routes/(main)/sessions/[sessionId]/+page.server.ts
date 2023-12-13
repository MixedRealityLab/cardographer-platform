import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security"
import type {Session, SessionSnapshot, User} from "$lib/types"
import {error} from "@sveltejs/kit";
import type {Actions, PageServerLoad} from './$types'

export const load: PageServerLoad = async function ({locals, parent}) {
	verifyAuthentication(locals)
	const session = await parent()
	const db = await getDb()
	const users = await db.collection<User>('Users')
		.find({})
		.project({_id: false, name: true, email: true})
		.toArray()
	return {
		session: session,
		users: users
	}
}

export const actions: Actions = {
	default: async ({locals, request, params}) => {
		verifyAuthentication(locals)
		const {sessionId} = params
		const db = await getDb()
		const session = await db.collection<Session>('Sessions').findOne({
			_id: sessionId, owners: locals.email
		})
		if (!session) {
			throw error(404, `Session ${sessionId} not found`);
		}

		const data = await request.formData();
		let owners = data.getAll('owners') as string[]
		if (!owners || owners.length == 0 || owners[0] == '') {
			owners = session.owners
		}

		const updateResult = await db.collection<Session>('Sessions').updateOne(
			{_id: sessionId},
			{
				$set: {
					name: data.get('name') as string || session.name,
					description: data.get('description') as string || '',
					credits: data.get('credits') as string || '',
					miroDuplicateUrl: data.get('miroDuplicateUrl') as string || '',
					owners: owners,
					isPublic: data.get('isPublic') == 'on',
					isTemplate: data.get('isTemplate') == 'on',
					isArchived: data.get('isArchived') == 'on',
					isConsentForStats: data.get('isConsentForStats') == 'on',
					isConsentForText: data.get('isConsentForText') == 'on',
					isConsentForRecording: data.get('isConsentForRecording') == 'on',
					isConsentToIdentify: data.get('isConsentToIdentify') == 'on',
					isConsentRequiresCredit: data.get('isConsentRequiresCredit') == 'on',
					consentDetails: data.get('consentDetails') as string || '',
					lastModified: new Date().toISOString()
				}
			})
		if (updateResult.modifiedCount == 0) {
			throw error(500, "Error Updating: ")
		}

		const updateSnapshots = await db.collection<SessionSnapshot>('SessionSnapshots').updateMany(
			{sessionId: sessionId},
			{
				$set: {
					sessionName: data.get('name') as string || session.name,
					sessionDescription: data.get('description') as string || '',
					sessionCredits: data.get('credits') as string || '',
					owners: owners,
					isPublic: data.get('isPublic') == 'on',
				}
			})
		return {success: true}
	}
}