import {getDb} from '$lib/db';
import type {Analysis, CardDeckRevision, CardDeckSummary, Session, SessionSnapshot, User, UserAudit} from "$lib/types"
import {getDiskSizeK} from './builders';
import {arrayToCsv} from "./csvutils";
import {
	getQuotaDetails,
	getUsageAnalyses,
	getUsageDecks,
	getUsageDiskSizeK,
	getUsageRevisions,
	getUsageSessions,
	getUsageSnapshots
} from './quotas';

const HEADERS = [ // ordered
	"email",
	"name",
	"created",
	"disabled",
	"lastAccess",
	"lastLogin",
	"countLoginFailure",
	"lastLoginFailure",
	"isNew",
	"isVerified",
	"isAdmin",
	"isGuest",
	"isDeckBuilder",
	"isPublisher",
	"publicRevisions",
	"publicSessions",
	"publicSnapshots",
	"publicAnalyses",
	"usageDecks",
	"quotaDecks",
	"usageRevisions",
	"quotaRevisions",
	"usageSessions",
	"quotaSessions",
	"usageSnapshots",
	"quotaSnapshots",
	"usageAnalyses",
	"quotaAnalyses",
	"usageDiskSizeK",
	"quotaDiskSizeK",
	"notes",
]

export async function exportAuditAsCsv(): Promise<string> {
	const db = await getDb()
	const rows: string[][] = []
	// title
	rows.push(HEADERS)
	const users = await db.collection<User>('Users')
		.find({})
		.toArray()
	for (const user of users) {
		let email: any = user.email
		if (!user.email) {
			console.log(`Error: user ${user._id} has no email!`)
			email = user._id
		}
		const quota = await getQuotaDetails(email)
		let audit: UserAudit = {
			email: email,
			name: user.name,
			disabled: user.disabled,
			created: user.created,
			lastLogin: user.lastLogin, // ISO date
			lastLoginFailure: user.lastLoginFailure, // ISO date
			countLoginFailure: user.countLoginFailure ? user.countLoginFailure : 0,
			lastAccess: user.lastAccess, // ISO date
			isNew: !!user.isNew,
			isVerified: !!user.isVerified,
			isAdmin: !!user.isAdmin,
			isGuest: !!user.isGuest,
			isDeckBuilder: !!user.isDeckBuilder,
			isPublisher: !!user.isPublisher,
			quotaDecks: quota.quota.decks,
			quotaRevisions: quota.quota.revisions,
			quotaSessions: quota.quota.sessions,
			quotaSnapshots: quota.quota.snapshots,
			quotaAnalyses: quota.quota.analyses,
			quotaDiskSizeK: quota.quota.diskSizeK,
			usageDecks: await getUsageDecks(email),
			usageRevisions: await getUsageRevisions(email),
			usageSessions: await getUsageSessions(email),
			usageSnapshots: await getUsageSnapshots(email),
			usageAnalyses: await getUsageAnalyses(email),
			usageDiskSizeK: await getUsageDiskSizeK(email),
			publicRevisions: await db.collection<CardDeckRevision>("CardDeckRevisions").countDocuments({
				quotaUser: email,
				isPublic: true
			}),
			publicSessions: await db.collection<Session>("Sessions").countDocuments({quotaUser: email, isPublic: true}),
			publicSnapshots: await db.collection<SessionSnapshot>("SessionSnapshots").countDocuments({
				quotaUser: email,
				isPublic: true
			}),
			publicAnalyses: await db.collection<Analysis>("Analyses").countDocuments({quotaUser: email, isPublic: true}),
			notes: '',
		}
		let row: string[] = []
		for (const h of HEADERS) {
			row.push(audit[h])
		}
		rows.push(row)
	}
	// to CSV
	return arrayToCsv(rows);
}

async function checkAndFixOwnerAndQuota(db, collection: string, defaultEmail: string, fix: boolean = true, emails: string[]): Promise<void> {
	// check all (for example) sessions...
	let sessions = await db.collection(collection).find({},
		{
			projection: {
				_id: true,
				owners: true, quotaUser: true,
			}
		}).toArray()
	for (let session of sessions) {
		// - do they have owner(s)
		if (!session.owners || session.owners.length == 0) {
			session.owners = [defaultEmail]
			if (fix) {
				console.log(`Fix ${collection} ${session._id} owner as ${defaultEmail}`)
				await db.collection(collection).updateOne(
					{_id: session._id},
					{
						$set: {owners: session.owners}
					}
				)
			} else {
				console.log(`${collection} ${session._id} has no owner - fix as ${session.owners.join(",")}?`)
			}
		} else {
			for (let owner of session.owners) {
				if (emails.indexOf(owner) < 0) {
					emails.push(owner)
				}
			}
		}
		// - do they have quota user?
		if (!session.quotaUser) {
			session.quotaUser = session.owners[0]
			if (fix) {
				console.log(`Fix ${collection} ${session._id} quotaUser as ${session.owners[0]}`)
				await db.collection(collection).updateOne(
					{_id: session._id},
					{
						$set: {quotaUser: session.quotaUser}
					}
				)
			} else {
				console.log(`${collection} ${session._id} has no quotaUser - fix as ${session.quotaUser}?`)
			}
		} else if (session.owners.indexOf(session.quotaUser) < 0) {
			let oldQuotaUser = session.quotaUser
			session.quotaUser = session.owners[0]
			if (fix) {
				console.log(`Fix ${collection} ${session._id} quotaUser as ${session.owners[0]} instead of non-owner ${oldQuotaUser}`)
				await db.collection(collection).updateOne(
					{_id: session._id},
					{
						$set: {quotaUser: session.quotaUser}
					}
				)
			} else {
				console.log(`${collection} ${session._id} has non-owner quotaUser ${oldQuotaUser} - fix as ${session.quotaUser}?`)
			}
		} else {
			if (emails.indexOf(session.quotaUser) < 0) {
				emails.push(session.quotaUser)
			}
		}
	}
}

export async function checkAndFixDb(defaultEmail: string, fix: boolean = true): Promise<void> {
	const db = await getDb()
	// keep ALL emails used for later
	let emails: string[] = [defaultEmail]
	// check all decks...
	let decks = await db.collection<CardDeckSummary>("CardDeckSummaries").find({},
		{
			projection: {
				_id: true, isPublic: true,
				owners: true, quotaUser: true, currentRevision: true,
			}
		}).toArray()
	for (let deck of decks) {
		// - do they have owner(s)
		if (!deck.owners || deck.owners.length == 0) {
			deck.owners = [defaultEmail]
			if (fix) {
				console.log(`Fix deck ${deck._id} owner as ${defaultEmail}`)
				await db.collection<CardDeckSummary>("CardDeckSummaries").updateOne(
					{_id: deck._id},
					{
						$set: {owners: deck.owners}
					}
				)
			} else {
				console.log(`Deck ${deck._id} has no owner - fix as ${deck.owners.join(",")}?`)
			}
		} else {
			for (let owner of deck.owners) {
				if (emails.indexOf(owner) < 0) {
					emails.push(owner)
				}
			}
		}
		// - do they have quota user?
		if (!deck.quotaUser) {
			deck.quotaUser = deck.owners[0]
			if (fix) {
				console.log(`Fix deck ${deck._id} quotaUser as ${deck.owners[0]}`)
				await db.collection<CardDeckSummary>("CardDeckSummaries").updateOne(
					{_id: deck._id},
					{
						$set: {quotaUser: deck.quotaUser}
					}
				)
			} else {
				console.log(`Deck ${deck._id} has no quotaUser - fix as ${deck.quotaUser}?`)
			}
		} else if (deck.owners.indexOf(deck.quotaUser) < 0) {
			let oldQuotaUser = deck.quotaUser
			deck.quotaUser = deck.owners[0]
			if (fix) {
				console.log(`Fix deck ${deck._id} quotaUser as ${deck.owners[0]} instead of non-owner ${oldQuotaUser}`)
				await db.collection<CardDeckSummary>("CardDeckSummaries").updateOne(
					{_id: deck._id},
					{
						$set: {quotaUser: deck.quotaUser}
					}
				)
			} else {
				console.log(`Deck ${deck._id} has non-owner quotaUser ${oldQuotaUser} - fix as ${deck.quotaUser}?`)
			}
		} else {
			if (emails.indexOf(deck.quotaUser) < 0) {
				emails.push(deck.quotaUser)
			}
		}
		// - do they have any revisions?
		let revisions = await db.collection<CardDeckRevision>("CardDeckRevisions").find(
			{deckId: deck._id},
			{projection: {_id: true, deckId: true, revision: true}}
		).toArray()
		if (revisions.length == 0) {
			console.log(`Deck ${deck._id} has no revisions`)
			// TODO fix??
		} else {
			// - does their currentRevision exist? is it the max?
			let current = revisions.find((r) => r.revision == deck.currentRevision)
			let max = revisions.reduce((m, r) => Math.max(m, r.revision), 0)
			if (!current || deck.currentRevision != max) {
				if (fix) {
					deck.currentRevision = max
					console.log(`Fix deck ${deck._id} currentRevision as ${max}`)
					await db.collection<CardDeckSummary>("CardDeckSummaries").updateOne(
						{_id: deck._id},
						{
							$set: {currentRevision: deck.currentRevision}
						}
					)
				} else {
					if (!current) {
						console.log(`Deck ${deck._id} currentRevision ${deck.currentRevision} does not exist - fix as ${max}?`)
					} else {
						console.log(`Deck ${deck._id} currentRevision ${deck.currentRevision} is not the latest - fix as ${max}?`)
					}
					deck.currentRevision = max
				}
			}
		}
	}
	// check all revisions...
	let revisions = await db.collection<CardDeckRevision>("CardDeckRevisions").find({},
		{
			projection: {
				_id: true, deckId: true, revision: true, isPublic: true,
				quotaUser: true, diskSizeK: true,
			}
		}).toArray()
	for (let revision of revisions) {
		// - do they have a CardDeckSummary?
		let deck = decks.find((d) => d._id == revision.deckId)
		if (!deck) {
			let quotaUser = revision.quotaUser ? revision.quotaUser : defaultEmail
			let max = revisions.filter((r) => r.deckId == revision.deckId).reduce((m, r) => Math.max(m, r.revision), 0)
			deck = {
				_id: revision.deckId,
				isPublic: false,
				owners: [quotaUser],
				currentRevision: max,
				quotaUser: quotaUser,
			}
			decks.push(deck)
			if (fix) {
				// add deck
				await db.collection<CardDeckSummary>('CardDeckSummaries').insertOne(deck)
				console.log(`Fix revision ${revision.deckId}/${revision.revision} add missing deck ${deck._id} with current revision ${deck.currentRevision} and owner ${quotaUser}`)
			} else {
				console.log(`Revision ${revision.deckId}/${revision.revision} missing deck - fix with new deck ${deck._id} with current revision ${deck.currentRevision} and owner ${quotaUser}`)
			}
		}
		// - do they have a quotaUser?
		if (!revision.quotaUser) {
			revision.quotaUser = deck.owners[0]
			if (fix) {
				console.log(`Fix revision ${revision.deckId}/${revision.revision} quotaUser as ${deck.owners[0]}`)
				await db.collection<CardDeckRevision>("CardDeckRevisions").updateOne(
					{_id: revision._id},
					{
						$set: {quotaUser: revision.quotaUser}
					}
				)
			} else {
				console.log(`Revision ${revision.deckId}/${revision.revision} has no quotaUser - fix as ${deck.quotaUser}?`)
			}
		} else if (deck.quotaUser != revision.quotaUser) {
			let oldQuotaUser = revision.quotaUser
			revision.quotaUser = deck.quotaUser
			if (fix) {
				console.log(`Fix revision ${revision.deckId}/${revision.revision} quotaUser as ${deck.quotaUser} to match deck instead of ${oldQuotaUser}`)
				await db.collection<CardDeckRevision>("CardDeckRevisions").updateOne(
					{_id: revision._id},
					{
						$set: {quotaUser: revision.quotaUser}
					}
				)
			} else {
				console.log(`revision ${revision.deckId}/${revision.revision} has non-deck quotaUser ${oldQuotaUser} - fix as ${deck.quotaUser}?`)
			}
			if (emails.indexOf(revision.quotaUser) < 0) {
				emails.push(revision.quotaUser)
			}
		} else {
			if (emails.indexOf(deck.quotaUser) < 0) {
				emails.push(deck.quotaUser)
			}
		}
		// - do they have a diskSizeK?
		if (typeof (revision.diskSizeK) != 'number') {
			revision.diskSizeK = await getDiskSizeK(revision.deckId, String(revision.revision))
			if (fix) {
				console.log(`Fix revision ${revision.deckId}/${revision.revision} diskSizeK as ${revision.diskSizeK}`)
				await db.collection<CardDeckRevision>("CardDeckRevisions").updateOne(
					{_id: revision._id},
					{
						$set: {diskSizeK: revision.diskSizeK}
					}
				)
			} else {
				console.log(`revision ${revision.deckId}/${revision.revision} has no diskSizeK - fix as ${revision.diskSizeK}?`)
			}
		}
	}
	// check all sessions
	await checkAndFixOwnerAndQuota(db, "Sessions", defaultEmail, fix, emails)
	// check all snapshots...
	await checkAndFixOwnerAndQuota(db, "SessionSnapshots", defaultEmail, fix, emails)
	// check all analyses...
	await checkAndFixOwnerAndQuota(db, "Analyses", defaultEmail, fix, emails)
	// check all emails...
	let users: User[] = await db.collection<User>("Users").find({},
		{
			projection: {
				_id: true, email: true,
			}
		}).toArray()
	for (let email of emails) {
		// - do they have a User object?
		let user: User = users.find((u) => u.email == email)
		if (!user) {
			user = {
				name: email.indexOf("@") > 0 ? email.substring(0, email.indexOf("@")) : email,
				email: email,
				password: "foohash",
				disabled: true,
				created: new Date().toISOString(),
				isNew: true,
			}
			users.push(user)
			if (fix) {
				console.log(`Fix missing user ${email} (disabled)`)
				await db.collection<User>('Users').insertOne(user)
			} else {
				console.log(`User ${email} mentioned as owner/quotaUser but doesn't exist - add to fix`)
			}
		}
	}
	// check all users...?
}
