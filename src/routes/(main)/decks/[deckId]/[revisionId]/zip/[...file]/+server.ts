import {getFilePath} from "$lib/builders";
import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security";
import type {CardDeckSummary} from "$lib/types";
import AdmZip from "adm-zip";
import { verifyLocalUserIsDeckBuilder } from "$lib/userutils";

export const GET = async function ({locals, params}) {
	await verifyAuthentication(locals)
	await verifyLocalUserIsDeckBuilder(locals)
	const {deckId, revisionId, file} = params;
	const db = await getDb();
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		return new Response(undefined, {status: 404});
	}
	try {
		const path = await getFilePath(deckId, revisionId, file);
		const fileParts = file.split('/').reverse()
		console.log(fileParts)
		const lastPart = fileParts.find(part => part !== '')
		const filename = lastPart != null ? lastPart + ".zip" : "build.zip"
		const zip = new AdmZip();
		zip.addLocalFolder(path)
		return new Response(zip.toBuffer(), {
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': 'attachment; filename=' + filename
			}
		})
	} catch (err) {
		console.log(`error getting file ${deckId}/${revisionId}/${file}: ${err.message}`);
		return new Response(undefined, {status: 500})
	}
}