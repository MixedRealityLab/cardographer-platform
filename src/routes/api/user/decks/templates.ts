import {getDb} from '$lib/db';
import {isNotAuthenticated} from "$lib/security";
import type {CardDeckRevisionSummary} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';
import {cleanRevisions} from "./revisions";

const debug = true;

export const get: RequestHandler = async function ({locals}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	const db = await getDb();
	// isPublic & isTemplate, project to summary
	const revisions = await db.collection<CardDeckRevisionSummary>('CardDeckRevisions').find({
		$or: [{isPublic: true}, {owners: locals.email}], isTemplate: true, isUsable: true
	}, {
		projection: {
			_id: true, deckId: true, revision: true, slug: true, deckName: true,
			deckDescription: true, deckCredits: true, created: true,
			lastModified: true, revisionName: true,
			revisionDescription: true, isUsable: true, isPublic: true,
			isLocked: true, isTemplate: true, cardCount: true
		}
	}).toArray()
	await cleanRevisions(revisions, db)
	if (debug) console.log(`found ${revisions.length} public templates`);
	return {
		body: {
			values: revisions as any
		}
	}
}

