import {copyBuild} from "$lib/builders";
import type {CardDeckRevision, CardDeckRevisionSummary, CardDeckSummary, User} from "$lib/types";
import {DeckBuildStatus} from "$lib/types";
import {error} from "@sveltejs/kit";
import type {Db} from "mongodb";

export async function cleanRevisions(revisions: CardDeckRevisionSummary[], db: Db) {
	const users = await db.collection<User>('Users').find({}).toArray()
	for (const revision of revisions) {
		if (!(revision.deckCredits)) {
			const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({_id: revision.deckId})
			if (deck) {
				if (deck.owners && deck.owners.length > 0) {
					revision.deckCredits = deck.owners.map(owner => userName(owner, users)).join(', ')
				}
			}
		}
	}
}

function userName(email: string, users: User[]): string {
	const user = users.find(user => user.email === email)
	if (user.name) {
		return user.name
	}

	return email.slice(0, email.indexOf('@'))
}

export async function cleanRevision(db: Db, revision: CardDeckRevision, deckId: string, revId: number) {
	const oldRevisionId = revision._id;
	const now = new Date().toISOString();
	// existing local revision?
	const oldRevision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		_id: oldRevisionId
	})
	// sanitise revision
	revision.deckId = deckId;
	revision.revision = revId;
	revision._id = `${deckId}:${revId}`;
	revision.slug = '';
	revision.created = revision.lastModified = now;
	revision.isUsable = false;
	revision.isPublic = false;
	revision.isLocked = false;
	revision.isTemplate = false;
	delete revision.isCurrent;
	if (oldRevision) {
		//if (debug) console.log(`copying build from existing revision ${oldRevisionId}`);
		revision.build = await copyBuild(oldRevision, revision);
	} else if (revision.build) {
		//if (debug) console.log(`cannot copy build - old revision ${oldRevisionId} not found`);
		delete revision.build.lastBuilt;
		revision.build.status = DeckBuildStatus.Unbuilt;
		revision.build.messages = [];
	}
}

export async function getRevision(db: Db, deckId: string, revisionId: number, email: string): Promise<CardDeckRevision> {
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId
	})
	if (!deck) {
		throw error(404, `Deck ${deckId} not found`);
	}
	const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		deckId: deckId, revision: revisionId
	})
	if (!revision) {
		throw error(404, `Deck ${deckId} revision ${revisionId} not found`);
	}

	if (!revision.isPublic && !deck.owners.includes(email)) {
		throw error(401, `Deck Access Not Permitted`);
	}

	revision.isCurrent = revision.revision == deck.currentRevision
	return revision
}
