import {base} from "$app/paths";
import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security";
import type {AtlasInfo, CardDeckRevision, Session} from "$lib/types";
import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {mkdir, writeFile} from 'fs/promises'

export const GET: RequestHandler = async function ({locals, params, url}) {
	await verifyAuthentication(locals)
	const {sessionId} = params;
	const db = await getDb();
	// permission check
	const session = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	if (!session) {
		throw error(404)
	}

	const dirName = '/app/data/sessions/' + sessionId + '/'
	await mkdir(dirName, {recursive: true})

	const cardIds = session.decks.map((deck) => deck.deckId + ":" + deck.revision)
	const cards = await db.collection<CardDeckRevision>('CardDeckRevisions').find(
		{_id: {$in: cardIds}}
	).toArray()
	const atlases = cards.filter((cards) => cards.output && cards.output.atlases).flatMap((cards) => cards.output.atlases).map((atlas) => absoluteAtlas(url, atlas))

	// Create DeckInfo.json
	await writeFile(dirName + 'DeckInfo.json', JSON.stringify(atlases), 'utf-8')

	return json({success: true})
}

function absoluteAtlas(url: URL, atlas: AtlasInfo): AtlasInfo {
	atlas.atlasURLs = atlas.atlasURLs.map((atlasUrl) => atlasUrl.startsWith('/') ? 'https://' + url.host + base + atlasUrl : atlasUrl)
	if (!atlas.cardSize) {
		atlas.cardSize = [120, 70]
	}
	return atlas
}