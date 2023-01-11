import {getDb} from "$lib/db"
import {verifyAuthentication} from "$lib/security";
import type {CardDeckRevision, CardDeckSummary} from "$lib/types"
import type {Actions} from "@sveltejs/kit"
import {error} from "@sveltejs/kit"

export const actions: Actions = {
	default: async ({locals, request, params}) => {
		verifyAuthentication(locals)
		const {deckId, revisionId} = params
		const db = await getDb()
		const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
			_id: deckId, owners: locals.email
		})
		if (!deck) {
			return error(404, `Deck ${deckId} not found`);
		}
		// project to summary
		const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
			deckId: deckId, revision: Number(revisionId)
		})
		if (!revision) {
			return error(404, `Deck ${deckId}/${revisionId} not found`);
		}

		const data = await request.formData();
		const updateResult = await db.collection<CardDeckRevision>('CardDeckRevisions').updateOne({
			deckId: deckId, revision: Number(revisionId)
		}, {
			$set: {
				deckName: data.get('deckName') as string || revision.deckName,
				deckDescription: data.get('deckDescription') as string || revision.deckDescription,
				deckCredits: data.get('deckCredits') as string || revision.deckCredits,
				revisionName: data.get('revisionName') as string || revision.revisionName,
				revisionDescription: data.get('revisionDescription') as string || revision.revisionDescription,
				slug: data.get('slug') as string || revision.slug,
				isUsable: data.get('isUsable') == 'on',
				isPublic: data.get('isPublic') == 'on',
				isLocked: data.get('isLocked') == 'on',
				isTemplate: data.get('isTemplate') == 'on',
				lastModified: new Date().toISOString()
			}
		})
		if (updateResult.modifiedCount == 0) {
			return error(500, "Error Updating: ")
		}
		return {success: true}
	}
}