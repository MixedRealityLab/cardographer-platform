import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security"
import type {Analysis, User} from "$lib/types";
import {error} from "@sveltejs/kit"
import type {Actions, PageServerLoad} from './$types'

export const load: PageServerLoad = async function ({locals, parent}) {
	verifyAuthentication(locals)
	const analysis = await parent()
	const db = await getDb()
	const users = await db.collection<User>('Users')
		.find({})
		.project({_id: false, name: true, email: true})
		.toArray()
	return {
		analysis: analysis,
		users: users
	}
}

export const actions: Actions = {
	default: async ({locals, request, params}) => {
		verifyAuthentication(locals)
		const {analysisId} = params
		const db = await getDb()
		const analysis = await db.collection<Analysis>('Analyses').findOne({
			_id: analysisId, owners: locals.email
		})
		if (!analysis) {
			throw error(404, `Analysis ${analysisId} not found`);
		}

		const data = await request.formData();
		let owners = data.getAll('owners') as string[]
		if(!owners || owners.length == 0||owners[0] == '') {
			owners = analysis.owners
		}

		const updateResult = await db.collection<Analysis>('Analyses').updateOne({
			_id: analysisId
		}, {
			$set: {
				name: data.get('name') as string || analysis.name,
				description: data.get('description') as string || analysis.description,
				credits: data.get('credits') as string || analysis.credits,
				owners: owners,
				isPublic: data.get('isPublic') == 'on',
				lastModified: new Date().toISOString()
			}
		})
		if (updateResult.modifiedCount == 0) {
			throw error(500, "Error Updating: ")
		}
		return {success: true}
	}
}