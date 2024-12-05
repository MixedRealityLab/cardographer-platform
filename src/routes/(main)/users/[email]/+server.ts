import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security";
import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import type {User, Session, CardDeckSummary, CardDeckRevision, Analysis, SessionSnapshot} from "$lib/types"
import {getLocalUser} from "$lib/userutils"
import {rm} from "fs/promises";

// noinspection JSUnusedGlobalSymbols
export const DELETE: RequestHandler = async function ({locals, params}) {
	await verifyAuthentication(locals)
	const {email} = params
    const localUser = await getLocalUser(locals)
    if (email != locals.email && !localUser.isAdmin) {
        console.log(`refuse to let non-admin ${locals.email} delete user ${email}`)
        throw error(403, "Non-admin cannot delete another user")
    }
    console.log(`Delete user ${email} by ${locals.email}`)
    const db = await getDb();
	await db.collection<CardDeckSummary>('CardDeckSummaries').deleteMany({
		quotaUser: email
	})
    const revisions = await db.collection<CardDeckRevision>('CardDeckRevisions')
        .find({
            quotaUser: email
        }, {
            projection: {
                _id: true, deckId: true, revision: true, quotaUser: true
            }
        })
        .toArray()
    for (const revision of revisions) {
        try {
            await rm('/app/uploads/' + revision.deckId + '/' + revision.revision, {recursive: true, force: true})
            console.log(`deleted files for revision ${revision.deckId}/${revision.revision}`)
        }
        catch (err){ 
            console.log(`Possible error deleting revision ${revision.deckId}/${revision.revision} files: ${err.message}`)
        }
    }  
	await db.collection<CardDeckRevision>('CardDeckRevisions').deleteMany({
		quotaUser: email
	})
	await db.collection<Session>('Sessions').deleteMany({
		quotaUser: email
	})
	await db.collection<SessionSnapshot>('SessionSnapshots').deleteMany({
		quotaUser: email
	})
	await db.collection<Analysis>('Analyses').deleteMany({
		quotaUser: email
	})
	await db.collection<User>('Users').deleteMany({
		email: email
	})
    console.log(`Deleted user ${email} by ${locals.email}`)
	return json({success: true})
}
