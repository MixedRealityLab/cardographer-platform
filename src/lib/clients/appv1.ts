// appv1 = vuforia app, pre2021
import { Client } from './types.ts';
import type {Session,SessionSnapshot} from '$lib/types.ts';

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

export class Appv1 extends Client {
        acceptsImport(data : any): boolean {
		if (data.design_title && data.design_cards) {
			return true;
		}
		return false;
	}
        sessionType(): string {
		return 'appv1';
	}
	makeSession(d: any): Session {
		const now = new Date().toISOString();
		const data = d as Appv1Data;
		let session:Session = {
			_id: '', // todo
			name: data.design_title,
			description: data.design_description,
			credits: data.design_author,
			owners: [],
			stages: [],
			currentStage: 0,
			created: now,
			lastModified: now,
			isPublic: false,
			isTemplate: false,
			isArchived: false,
			sessionType: 'appv1',
			// decks...
		}
		return session;
	}
	makeSessionSnapshot(d: any): SessionSnapshot {
		const data = d as Appv1Data;
		const now = new Date().toISOString();
		let snapshot:SessionSnapshot = {
			_id: '',
			sessionId: '',
			sessionName: data.design_title,
			sessionDescription: data.design_description,
			sessionCredits: data.design_author,
			sessionType: 'appv1',
			originallyCreated: new Date(data.design_creationTimestamp/1000).toISOString(),
			snapshotDescription: `Imported from legacy data ${data._id}`,
			owners: [],
			created: now, 
			isPublic: false,
			isNotForAnalysis: false,
			legacyId: data._id,
			appv1Data: data,
		};
		return snapshot;
	}
}
