import type {RequestHandler} from "@sveltejs/kit";
import {getDb} from "$lib/db";
import {isNotAuthenticated} from "$lib/security";
import type {CardDeckRevision} from "$lib/types";

export const get: RequestHandler = async function ({locals}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}

	const db = await getDb();
	const revisions = await db.collection<CardDeckRevision>('CardDeckRevisions').find({}).toArray();
	for (const deck of revisions) {
		deck.output.atlases.forEach((atlas) => {
			if (atlas.countX) {
				atlas.cardX = atlas.countX
				atlas.cardY = atlas.countY
			}
			delete atlas.countY;
			delete atlas.countX;
			delete atlas.atlasCount;
			if (atlas.builderId == "squib") {
				if (atlas.cardY[0] == 1) {
					atlas.cardY[0] = 3
				}
			}
		})

		await db.collection<CardDeckRevision>('CardDeckRevisions').replaceOne({"_id": deck._id}, deck)
	}

	return {}
}