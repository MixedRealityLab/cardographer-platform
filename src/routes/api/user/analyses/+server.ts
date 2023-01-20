import {getDb} from '$lib/db'
import {verifyAuthentication} from "$lib/security";
import type {Analysis} from '$lib/types'
import type {RequestHandler} from '@sveltejs/kit'
import {json} from '@sveltejs/kit';

export const GET: RequestHandler = async function ({locals}) {
	verifyAuthentication(locals, false)
	const db = await getDb()
	const analyses = await db.collection<Analysis>('Analyses').find({
		owners: locals.email
	}).toArray()
	return json({
		values: analyses as any
	})
}