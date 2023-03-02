import type {RequestHandler} from "@sveltejs/kit";
import {json} from "@sveltejs/kit";
import {getDb} from "./db";

// noinspection JSUnusedGlobalSymbols
export const POST: RequestHandler = async function ({request}) {
	let dumpDoc = await request.json()
	const db = await getDb()
	await db.collection('xSpace').insertMany(dumpDoc)
	return json("success")
}