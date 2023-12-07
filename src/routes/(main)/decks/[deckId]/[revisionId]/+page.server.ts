import {getDb} from "$lib/db"
import {getRevision} from "$lib/decks";
import {verifyAuthentication} from "$lib/security";
import type {CardDeckRevision} from "$lib/types"
import type {Actions} from "@sveltejs/kit"
import {error} from "@sveltejs/kit"

export const actions: Actions = {
	default: async ({locals, request, params}) => {
		verifyAuthentication(locals)
		const {deckId, revisionId} = params
		const db = await getDb()
		const revision = await getRevision(db, deckId, Number(revisionId), locals.email)
		if (!revision.isOwnedByUser) {
			throw error(401, `Deck Write Access Not Permitted`);
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
			throw error(500, "Error Updating: ")
		}
		return {success: true}
	}
}