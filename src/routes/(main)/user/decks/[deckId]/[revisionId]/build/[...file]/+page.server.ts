import {getFileInfo} from "$lib/builders";
import {verifyAuthentication} from "$lib/security"
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async function ({locals, params, parent}) {
	verifyAuthentication(locals)
	const revisions = await parent()
	const {deckId, revisionId, file} = params;
	try {
		const files = await getFileInfo(deckId, revisionId, file);
		return {
			revisions: revisions,
			files: files
		}
	} catch (err) {
		console.log(`error getting file ${deckId}/${revisionId}/${file}: ${err.message}`);
		return new Response(undefined, {status: 500})
	}
}