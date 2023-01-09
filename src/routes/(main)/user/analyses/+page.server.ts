import {getDb} from "$lib/db"
import {isNotAuthenticated} from "$lib/security"
import type {Analysis} from "$lib/types"
import type {Actions} from "@sveltejs/kit";
import type {PageServerLoad} from "./$types"

export const load: PageServerLoad = async function ({locals}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	// TODO if (debug) console.log(`get analyses`)
	const db = await getDb()
	const analyses = await db.collection<Analysis>('Analyses').find({
		owners: locals.email
	}).sort({"name": 1, "owners[0]": 1, "created": 1}).toArray()
	// TODO Project?
	//TODO if (debug) console.log(`${analyses.length} analyses for ${locals.email}`)
	return {analyses: analyses}
}

export const actions: Actions = {
	default: async ({setHeaders}) => {
		// TODO
		let error = ''
		let working = true
		const analysis: Analysis = {
			_id: '',
			name: 'New Analysis',
			isPublic: false,
			created: "",
			lastModified: new Date().toISOString(),
			owners: [],
			snapshotIds: [],
			regions: []
		}
		// TODO
		// let res = await fetch(`${base}/api/user/analyses`, authenticateRequest($session, {
		// 	method: 'POST',
		// 	headers: {
		// 		'content-type': 'application/json'
		// 	},
		// 	body: JSON.stringify(analysis)
		// }));
		// working = false;
		// if (res.ok) {
		// 	const info = await res.json();
		// 	// redirect
		// 	await goto(`analyses/${info.analysisId}`);
		// } else {
		// 	error = `Sorry, there was a problem (${res.statusText})`;
		// }
	}
}