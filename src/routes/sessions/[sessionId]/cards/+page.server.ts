import {getDb} from "$lib/db";
import {getRevision, cleanRevisions} from "$lib/decks"
import type {CardDeckRevisionSummary, Session} from "$lib/types"
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async function ({locals, params}) {
	const {sessionId} = params
	const db = await getDb();
	// deck-pseudo session
	const deckSession = sessionId.match(/^deck-([^-]+)-([0-9]+)$/);
	console.log(deckSession)
	if (deckSession) {
		const deckId = deckSession[1];
		const revisionNumber = Number(deckSession[2]);
		let revision = await getRevision(db, deckId, revisionNumber, locals.email);
		let decks = [revision];
		await cleanRevisions(decks, db);
		const session: Session = {
			_id: deckSession[0],
			name: `Auto-session for ${revision.deckName}`,
			//url?: string
			//description?: string
			//credits?: string
			owners: [],
			created: revision.created,
			lastModified: revision.lastModified,
			isPublic: revision.isPublic,
			isTemplate: false,
			isArchived: false,
			sessionType: 'deck',
			//board?: BoardInfo
			decks: decks,
		}
		return session;
	}
	// permission check
	// TODO session joining key or something... (need to support guest access)
	const session = await db.collection<Session>('Sessions').findOne({_id: sessionId})
	let decks = await db.collection<CardDeckRevisionSummary>('CardDeckRevisions').find({
		_id: {$in: session.decks.map((deck) => deck.deckId + ':' + deck.revision)}
	}).toArray()

	await cleanRevisions(decks, db)

	session.decks = decks

	return session
}