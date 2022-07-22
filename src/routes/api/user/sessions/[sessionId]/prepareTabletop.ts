import {base} from "$app/paths";
import type {RequestHandler} from "@sveltejs/kit";
import {getDb} from "$lib/db";
import {isNotAuthenticated} from "$lib/security";
import type {AtlasInfo, CardDeckRevision, Session} from "$lib/types";
import {mkdir, writeFile} from 'fs/promises'

export const GET: RequestHandler = async function ({locals, params, url}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}

	const {sessionId} = params;
	const db = await getDb();
	// permission check
	const session = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	if (!session) {
		return {status: 404};
	}

	const dirName = '/app/data/sessions/' + sessionId + '/'
	await mkdir(dirName, {recursive: true})

	const cardIds = session.decks.map((deck) => deck.deckId + ":" + deck.revision)
	const cards = await db.collection<CardDeckRevision>('CardDeckRevisions').find(
		{_id: {$in: cardIds}}
	).toArray()
	const atlases = cards.flatMap((cards) => cards.output.atlases).map((atlas) => absoluteAtlas(url, atlas))

	// Create DeckInfo.json
	await writeFile(dirName + 'DeckInfo.json', JSON.stringify(atlases), 'utf-8')

	return {}
}

function absoluteAtlas(url: URL, atlas: AtlasInfo): AtlasInfo {
	atlas.atlasURLs = atlas.atlasURLs.map((atlasUrl) => atlasUrl.startsWith('/') ? 'https://' + url.host + base + atlasUrl : atlasUrl)
	if (!atlas.cardSize) {
		atlas.cardSize = [120, 70]
	}
	return atlas
}