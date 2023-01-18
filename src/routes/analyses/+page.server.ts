import {base} from "$app/paths";
import {getDb, getNewId} from "$lib/db"
import {verifyAuthentication} from "$lib/security"
import type {Analysis} from "$lib/types"
import type {Actions} from "@sveltejs/kit";
import {error, redirect} from "@sveltejs/kit";
import type {PageServerLoad} from "./$types"

export const load: PageServerLoad = async function ({locals}) {
	verifyAuthentication(locals)
	const db = await getDb()
	const analyses = await db.collection<Analysis>('Analyses')
		.find({owners: locals.email})
		.sort({"name": 1, "owners[0]": 1, "created": 1})
		.toArray()
	// TODO Project?
	return {analyses: analyses}
}

export const actions: Actions = {
	default: async ({locals}) => {
		verifyAuthentication(locals)
		const db = await getDb()
		const newId = getNewId()
		const now = new Date().toISOString()
		const result = await db.collection<Analysis>('Analyses').insertOne({
			_id: newId,
			name: 'New Analysis',
			description: '',
			credits: '',
			created: now,
			lastModified: now,
			owners: [locals.email],
			isPublic: false,
			snapshotIds: [],
			regions: [],
		});
		if (!result.insertedId) {
			throw error(500);
		}

		throw redirect(302, base + '/user/analyses/' + newId)
	}
}