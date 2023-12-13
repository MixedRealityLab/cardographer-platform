import type {Session, SessionSnapshot, User} from "$lib/types";
import type {Db} from "mongodb";
import {userName} from "$lib/decks"

export async function checkSessionCredits(sessions: Session[], db: Db) {
	const users = await db.collection<User>('Users').find({}).toArray()
	for (const session of sessions) {
		if (!(session.credits) || !session.credits.trim()) {
			if (session.owners && session.owners.length > 0) {
                session.credits = session.owners.map(owner => userName(owner, users)).join(', ')
            }
        }
    }
}

export async function checkSessionSnapshotCredits(snapshots: SessionSnapshot[], db: Db) {
	const users = await db.collection<User>('Users').find({}).toArray()
	for (const snapshot of snapshots) {
		if (!(snapshot.sessionCredits) || !snapshot.sessionCredits.trim()) {
			if (snapshot.owners && snapshot.owners.length > 0) {
                snapshot.sessionCredits = snapshot.owners.map(owner => userName(owner, users)).join(', ')
            }
        }
    }
}
