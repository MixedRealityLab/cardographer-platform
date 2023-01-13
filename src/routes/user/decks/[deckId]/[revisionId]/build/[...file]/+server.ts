import {deleteFile} from "$lib/builders";
import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security";
import type {CardDeckRevision, CardDeckSummary} from "$lib/types";
import {dirname} from "path";

export const DEL = async function ({locals, params}) {
	verifyAuthentication(locals)
	const {deckId, revisionId, file} = params;
	const db = await getDb();
	// permission check
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		return new Response(undefined, {status: 404});
	}
	// revision
	const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		deckId: deckId, revision: Number(revisionId)
	})
	if (!revision) {
		return new Response(undefined, {status: 404});
	}
	if (revision.isLocked) {
		return new Response(undefined, {status: 401});
	}
	await deleteFile(deckId, revisionId, file)
	const parent = dirname(file)
	try {
		return {success: true}
	} catch (err) {
		console.log(`error getting file ${deckId}/${revisionId}/${parent}: ${err.message}`);
		return new Response(undefined, {status: 500})
	}
}