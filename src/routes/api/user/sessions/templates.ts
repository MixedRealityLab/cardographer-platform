import {getDb} from '$lib/db';
import {isNotAuthenticated} from "$lib/security";
import type {Session} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';

const debug = true;

export const get: RequestHandler = async function ({locals}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	const db = await getDb();
	// isPublic & isTemplate
	const sessions = await db.collection<Session>('Sessions').find({
		$or: [{isPublic: true}, {owners: locals.email}], isTemplate: true
	}, {
		projection: {
			_id: true, name: true, description: true, credits: true,
			owners: true, stages: true, created: true,
			lastModified: true, isPublic: true, isTemplate: true,
			isArchived: true, sessionType: true
			// players? playerTemplates? other stuff?
		}
	}).toArray()
	if (debug) console.log(`found ${sessions.length} public session templates`);
	return {
		body: {
			values: sessions as any
		}
	}
}

