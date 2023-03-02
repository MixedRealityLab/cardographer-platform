import type {RequestHandler} from "@sveltejs/kit";
import {json} from "@sveltejs/kit";
import {getDb} from "../db";

export const GET: RequestHandler = async function ({}) {
	const db = await getDb()
	return json(await db.collection('xSpace').find().toArray())
}