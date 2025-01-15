import type {SnapshotInfo} from '$lib/analysistypes'
import type {Session, SessionSnapshot} from '$lib/types'
import type {Filter} from "mongodb"
import {getNewId} from "../db"
import {Client} from './types'
import {getSnapshotInfoFromMiroData} from './miroutils'

export class MiroClient extends Client {
	acceptsImport(data: any): boolean {
		return !!(data.id && data.widgets && Array.isArray(data.widgets));
	}

	sessionType(): string {
		return 'miro';
	}

	makeSession(data: any): Session {
		const now = new Date().toISOString();
		return {
			_id: getNewId(),
			name: data.title || `Upload of Miro board ${data.id}`,
			miroId: data.id,
			description: data.description || `Imported Miro board https://miro.com/app/board/${data.id}`,
			credits: data.owner && data.owner.name ? data.owner.name : '',
			owners: [],
			created: now,
			lastModified: now,
			isPublic: false,
			isTemplate: false,
			isArchived: false,
			sessionType: 'miro',
			decks: [],
			isConsentForStats: false,
			isConsentForText: false,
			isConsentForRecording: false,
			isConsentToIdentify: false,
			isConsentRequiresCredit: false,
		}
	}

	makeSessionSnapshot(data: any, session: Session): SessionSnapshot {
		return {
			_id: getNewId(),
			sessionId: session._id,
			sessionName: session.name,
			sessionDescription: session.description,
			snapshotDescription: data.description || '',
			sessionCredits: session.credits,
			sessionType: 'miro',
			originallyCreated: data.createdAt,
			owners: session.owners,
			created: data.updatedAt,
			isPublic: false,
			isNotForAnalysis: false,
			legacyId: data._id,
			data: data,
		};
	}

	getExistingSessionQuery(data: any): Filter<Session> {
		// The plugin uses .url to match to miro boards, 
		// but keeping the plugin separate is probably good
		// so don't use that - so leaving for now...
		return null;
	}

	getSnapshotInfo(snapshot: SessionSnapshot): SnapshotInfo {
		const data = snapshot.data
		return getSnapshotInfoFromMiroData(data)
	}
}
