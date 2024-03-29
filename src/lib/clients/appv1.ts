// appv1 = vuforia app, pre2021
import type {BoardInfo, CardSnapshot, SnapshotInfo} from '$lib/analysistypes';
import type {Session, SessionSnapshot} from '$lib/types';
import type {Filter} from "mongodb";
import {Client} from './types';

// dump data
export interface Appv1Data {
	design_author: string;
	design_cards: Appv1Card[];
	design_creationTimestamp: number;
	design_decks: Appv1Deck[];
	design_description: string;
	design_title: string;
	_id: string;
}

export interface Appv1Card {
	card_id: string;
	card_nam: string; // same as id
	// null: card_category, card_image, card_title, card_type
}

// note, may be completed incorrectly
export interface Appv1Deck {
	deck_author: string;
	deck_cards: Appv1Card[]; // usually empty
	deck_description: string;
	deck_id: string;
	deck_name: string;
}

//http://balrob.blogspot.com/2014/04/windows-filetime-to-javascript-date.html
function fileTimeToDate(fileTime: number) {
	return new Date(fileTime / 10000 - 11644473600000);
}

export class Appv1 extends Client {
	acceptsImport(data: any): boolean {
		return !!(data.design_title && data.design_cards);
	}

	sessionType(): string {
		return 'appv1';
	}

	makeSession(d: any): Session {
		const now = new Date().toISOString();
		const data = d as Appv1Data;
		return {
			_id: '', // todo
			name: data.design_title,
			description: data.design_description,
			credits: data.design_author,
			owners: [],
			created: now,
			lastModified: now,
			isPublic: false,
			isTemplate: false,
			isArchived: false,
			sessionType: 'appv1',
			decks: [],
			isConsentForStats: false,
			isConsentForText: false,
			isConsentForRecording: false,
			isConsentToIdentify: false,
			isConsentRequiresCredit: false,
		}
	}

	makeSessionSnapshot(d: any): SessionSnapshot {
		const data = d as Appv1Data;
		const now = new Date().toISOString();
		const deck = data.design_decks && data.design_decks[0] ? data.design_decks[0].deck_name : 'unknown';
		return {
			_id: '',
			sessionId: '',
			sessionName: data.design_title,
			sessionDescription: data.design_description,
			sessionCredits: data.design_author,
			sessionType: 'appv1',
			originallyCreated: fileTimeToDate(data.design_creationTimestamp).toISOString(),
			snapshotDescription: `Imported from legacy data ${data._id}; claims deck ${deck}`,
			owners: [],
			created: now,
			isPublic: false,
			isNotForAnalysis: false,
			legacyId: data._id,
			data: data,
		}
	}

	getSnapshotInfo(snapshot: SessionSnapshot): SnapshotInfo {
		const board: BoardInfo = {
			id: "",//default
			cards: [],
			comments: [],
		};
		const info: SnapshotInfo = {
			boards: [board],
		};
		const data = snapshot.data as Appv1Data;
		if (!data) {
			console.log(`no appv1Data found in snapshot ${snapshot._id}`);
			return info;

		}
		const cards = data.design_cards;
		if (!cards) {
			console.log(`no cards in appv1 snapshot ${snapshot._id}`);
			return info;
		}
		for (const card of cards) {
			const ci: CardSnapshot = {
				id: card.card_id,
			}
			board.cards.push(ci);
		}
		return info;
	}

	getExistingSessionQuery(d: any): Filter<Session> {
		// no
		return null;
	}
}
