import {getDb} from '$lib/db';
import type {ServerLocals} from '$lib/systemtypes';
import type {Analysis} from '$lib/types';
import type {EndpointOutput, Request} from '@sveltejs/kit';

const debug = true;

export async function get(request: Request): Promise<EndpointOutput> {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 403}
	}
	const {analid} = request.params;
	if (debug) console.log(`get analysis ${analid}`);
	const db = await getDb();
	// permission check
	const analysis = await db.collection<Analysis>('Analyses').findOne({
		_id: analid, owners: locals.email
	})
	if (!analysis) {
		if (debug) console.log(`analysis ${analid} not found for ${locals.email}`);
		return {status: 404};
	}
	// project?
	return {
		body: analysis as any
	}
}
  
