import {getDb} from '$lib/db.ts';
import type {Session} 
  from '$lib/types.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';

const debug = true;

export async function get(request): RequestHandler {
	const db = await getDb();
	// isPublic & isTemplate
	const sessions = await db.collection('Sessions').find({
                isPublic: true, isTemplate: true
        }, { _id: true, name: true, description:true, credits: true, 
		owners: true, stages: true, created: true,
		lastModified:true, isPublic:true, isTemplate:true,
		isArchived: true, sessionType:true
		// players? playerTemplates? other stuff?
	}).toArray() as Session[];
	if (debug) console.log(`found ${sessions.length} public session templates`);
	return {
		body: {
			values: sessions
		}
	}
}

