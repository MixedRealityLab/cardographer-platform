import {getDb} from '$lib/db';
import type {Session} from '$lib/types';
import type {EndpointOutput} from '@sveltejs/kit';

const debug = true;

export async function get(): Promise<EndpointOutput> {
	const db = await getDb();
	// isPublic & isTemplate
	const sessions = await db.collection<Session>('Sessions').find({
		isPublic: true, isTemplate: true
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

