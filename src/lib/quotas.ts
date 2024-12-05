import type {Quota,QuotaDetails, Usage} from "$lib/types"
import { getDb } from "./db";
import { CardDeckRevision, User } from "./types";
import {error} from "@sveltejs/kit";
import {GUEST_EMAIL} from "$lib/userutils"
import type {CardDeckSummary, CardDeckRevisionSummary, Analysis, Session, SessionSnapshot } from "$lib/types"
import { getDiskSizeK } from "./builders";

const zero_quota: Quota = {
    decks: 0,
	revisions: 0,
	sessions: 0,
	snapshots: 0,
	analyses: 0,
	diskSizeK: 0,  
}
const guest_quota: Quota = {
    decks: 0,
	revisions: 0,
	sessions: 0,
	snapshots: 0,
	analyses: 0,
	diskSizeK: 0,  
}
const default_quota: Quota = {
    decks: 0,
	revisions: 0,
	sessions: 5,
	snapshots: 10,
	analyses: 10,
	diskSizeK: 0,  
}
const deck_builder_quota: Quota = {
    decks: 2,
	revisions: 10,
	sessions: 10,
	snapshots: 20,
	analyses: 20,
	diskSizeK: 100000,  
}

export const CHECK_REVISION_DISK_SIZE = false

function addQuotas(a:Quota, b:Quota): Quota {
    return {
        decks: (a.decks ?? 0) + (b.decks ?? 0),
        revisions: (a.revisions ?? 0) + (b.revisions ?? 0),
        sessions: (a.sessions ?? 0) + (b.sessions ?? 0),
        snapshots: (a.snapshots ?? 0) + (b.snapshots ?? 0),
        analyses: (a.analyses ?? 0) + (b.analyses ?? 0),
        diskSizeK: (a.diskSizeK ?? 0) + (b.diskSizeK ?? 0),
    }
}
export async function getQuotaDetails(email:string): Promise<QuotaDetaila> {
    if (email == GUEST_EMAIL) {
        return {
            baseQuota: { ...guest_quota },
            extraQuota: { ...zero_quota },
            quota: addQuotas(guest_quota, zero_quota)
        }
    }
    const db = await getDb()
	let user = await db.collection<User>('Users')
		.findOne({email:email}, {
			projection: {
				email: true, name: true, disabled: true,
				isAdmin: true, isPublisher: true, isDeckBuilder: true,
				extraQuota: true, usage: true,
			}
		})
    if (!user) {
        throw error(500, `User (quota) ${email} not found`);
    }
    let baseQuota = user.isDeckBuilder ? { ...deck_builder_quota } : { ...default_quota }
    let extraQuota = user.extraQuota ? { ...user.extraQuota } : { ...zero_quota }
    return {
        baseQuota,
        extraQuota,
        quota: addQuotas(baseQuota, extraQuota)
    }
}

export async function getUsageDecks(email: string) : Promise<number> {
    const db = await getDb()
    const number = await db.collection<CardDeckSummary>("CardDeckSummaries").count(
        {quotaUser:email},
    )
    return number
}
export async function getUsageRevisions(email: string) : Promise<number> {
    const db = await getDb()
    const number = await db.collection<CardDeckRevisionSummary>("CardDeckRevisions").count(
        {quotaUser:email},
    )
    return number
}
export async function getUsageSessions(email: string) : Promise<number> {
    const db = await getDb()
    const number = await db.collection<Session>("Sessions").count(
        {quotaUser:email},
    )
    return number
}
export async function getUsageSnapshots(email: string) : Promise<number> {
    const db = await getDb()
    const number = await db.collection<SessionSnapshot>("SessionSnapshots").count(
        {quotaUser:email},
    )
    return number
}
export async function getUsageAnalyses(email: string) : Promise<number> {
    const db = await getDb()
    const number = await db.collection<Analysis>("Analyses").count(
        {quotaUser:email},
    )
    return number
}
export async function getUsageDiskSizeK(email: string) : Promise<number> {
    const db = await getDb()
    const sizeRec = await db.collection<CardDeckRevision>("CardDeckRevisions").aggregate([
        { $match: { quotaUser: email } },
        { $group: { _id:'', diskSizeK: { $sum: '$diskSizeK' }}},
    ]).next()
    const size = sizeRec === null ? 0 : sizeRec.diskSizeK
    //console.log(`disk usage for ${email}: ${size}`, sizeRec)
    return size
}

export async function checkRevisionDiskSizes(revisions: CardDeckRevision[]): Promise<void> {
    const db = await getDb()
    for (let revision of revisions) {
        if (revision.diskSizeK === undefined || revision.diskSizeK === null) {
            const size = await getDiskSizeK(revision.deckId, String(revision.revision))
            await db.collection<CardDeckRevision>("CardDeckRevisions").updateOne({
                _id: revision._id
            }, {
                $set: {
                    diskSizeK: size,
                }
            })
            console.log(`Fix disk size of revision ${revision.deckId}/${revision.revision} = ${size}`)
            revision.diskSizeK = size
        }
    }
}