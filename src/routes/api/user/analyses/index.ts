import {getDb, getNewId} from '$lib/db'
import type {Analysis} from '$lib/types'
import type {EndpointOutput, Request} from '@sveltejs/kit'

const debug = true

export async function get({locals}: Request): Promise<EndpointOutput> {
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals)
		return {status: 401}
	}
	if (debug) console.log(`get analyses`)
	const db = await getDb()
	const analyses = await db.collection<Analysis>('Analyses').find({
		owners: locals.email
	}).toArray()
	// Project?
	if (debug) console.log(`${analyses.length} analyses for ${locals.email}`)
	return {
		body: {
			values: analyses as any
		}
	}
}

export async function post({locals, body}: Request): Promise<EndpointOutput> {
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 401}
	}
	let an = body as unknown as Analysis;
	//if (debug) console.log(`add analysis`, analysis);
	const db = await getDb()
	const newId = getNewId()
	const now = new Date().toISOString()
	const analysis: Analysis = {
		_id: newId,
		name: an.name || "Unnamed",
		description: an.description || "",
		credits: an.credits || "",
		created: now,
		lastModified: now,
		owners: [locals.email],
		isPublic: false,
		snapshotIds: [],
		regions: [],
	};
	// add
	let result = await db.collection<Analysis>('Analyses').insertOne(analysis);
	if (!result.insertedId) {
		console.log(`Error adding new analysis ${newId}`);
		return {status: 500};
	}
	console.log(`added analysis ${newId}`);

	return {
		body: {
			analysisId: newId
		}
	}
}