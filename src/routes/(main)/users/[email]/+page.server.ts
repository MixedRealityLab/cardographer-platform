import {getDb} from "$lib/db"
import {getUser, sendPasswordResetEmail} from "$lib/userutils"
import {verifyAuthentication} from "$lib/security"
import type {Usage, User} from "$lib/types"
import type {Actions} from "@sveltejs/kit"
import {error, redirect} from "@sveltejs/kit"
import {getUserIsAdmin} from "$lib/userutils"
import {base} from "$app/paths"
import type {PageServerLoad} from "./$types"
import {
	getQuotaDetails,
	getUsageDiskSizeK,
	getUsageDecks,
	getUsageRevisions,
	getUsageSessions,
	getUsageSnapshots,
	getUsageAnalyses
} from "$lib/quotas";
import {verifyLocalUserIsAdmin} from "$lib/userutils";

export const load: PageServerLoad = async function ({locals, params}) {
	await verifyAuthentication(locals)
	const {email} = params;
	const db = await getDb();
	const user = await getUser(db, email, locals.email)
	const quotaDetails = await getQuotaDetails(email)
	const usage: Usage = {
		decks: await getUsageDecks(email),
		sessions: await getUsageSessions(email),
		snapshots: await getUsageSnapshots(email),
		analyses: await getUsageAnalyses(email),
		revisions: await getUsageRevisions(email),
		diskSizeK: await getUsageDiskSizeK(email),
	}
	return {
		user: user,
		email,
		quotaDetails,
		usage,
	}
}

export const actions: Actions = {
	save: async ({locals, request, params}) => {
		await verifyAuthentication(locals)
		const {email} = params
		const db = await getDb()
		let localUser = await db.collection<User>('Users')
			.findOne({email: locals.email})
		const isAdmin = getUserIsAdmin(localUser)
		let user = await db.collection<User>('Users')
			.findOne({email: email})
		if (!user) {
			throw error(404, `User ${email} not found`);
		}
		if (email != locals.email && !isAdmin) {
			throw error(401, `User Write Access Not Permitted`);
		}
		const data = await request.formData();
		if (!isAdmin) {
			// can only change name :-)
			await db.collection<User>('Users').updateOne({
				email: email
			}, {
				$set: {
					name: data.get('userName') as string || user.name,
				}
			})
		} else {
			// admin updates...
			await db.collection<User>('Users').updateOne({
				email: email
			}, {
				// note, cannot disable or un-admin yourself, just in case :-)
				$set: {
					name: data.get('userName') as string || user.name,
					disabled: email != locals.email && data.get('isDisabled') == 'on',
					isDeckBuilder: data.get('isDeckBuilder') == 'on',
					isPublisher: data.get('isPublisher') == 'on',
					isAdmin: (email == locals.email && user.isAdmin) || data.get('isAdmin') == 'on',
					"extraQuota.decks": Number(data.get("extraDecks") as string || "0"),
					"extraQuota.revisions": Number(data.get("extraRevisions") as string || "0"),
					"extraQuota.sessions": Number(data.get("extraSessions") as string || "0"),
					"extraQuota.snapshots": Number(data.get("extraSnapshots") as string || "0"),
					"extraQuota.analyses": Number(data.get("extraAnalyses") as string || "0"),
					"extraQuota.diskSizeK": Number(data.get("extraDiskSizeK") as string || "0"),
				}
			})
		}
		return {success: true}
	},
	changeEmail: async ({locals, request, params}) => {
		await verifyAuthentication(locals)
		await verifyLocalUserIsAdmin(locals)
		const {email} = params
		const db = await getDb()
		let user = await db.collection<User>('Users').findOne({email: email})
		if (!user) {
			throw error(404, `User ${email} not found`);
		}
		const data = await request.formData();
		const newEmail = data.get('userEmail') as string
		if (!newEmail || newEmail.indexOf('@') <= 0 || newEmail.indexOf('@') + 1 >= newEmail.length) {
			throw error(400, `New email not valid (${newEmail})`)
		}
		if(user.email === newEmail) {
			return {success: true}
		}
		await changeQuotaUser(db, 'CardDeckRevisions', email, newEmail)
		await changeQuotaUserAndOwner(db, 'CardDeckSummaries', email, newEmail)
		await changeQuotaUserAndOwner(db, 'Sessions', email, newEmail)
		await changeQuotaUserAndOwner(db, 'SessionSnapshots', email, newEmail)
		await changeQuotaUserAndOwner(db, 'Analyses', email, newEmail)
		const newUser = await db.collection<User>("Users").findOne({email: newEmail})
		if (newUser) {
			console.log(`Merged old user ${email} into user ${newEmail}`)
			await db.collection<User>('Users').deleteOne({email})
		} else {
			console.log(`Changed user ${email} to ${newEmail}`)
			await db.collection<User>('Users').updateOne({
				email: email
			}, {
				$set: {
					email: newEmail,
					isVerified: false,
				}
			})
		}
		throw redirect(302, `${base}/users/${newEmail}`);
	},
	verifyEmail: async ({locals, params, url}) => {
		await verifyAuthentication(locals)
		const {email} = params
		if (locals.email !== email) {
			await verifyLocalUserIsAdmin(locals)
		}
		await sendPasswordResetEmail(email, url)
	}
}

async function changeQuotaUser(db, collection: string, email: string, newEmail: string): Promise<void> {
	await db.collection(collection).updateMany(
		{quotaUser: email},
		{
			$set: {quotaUser: newEmail}
		})
}

async function changeQuotaUserAndOwner(db, collection: string, email: string, newEmail: string): Promise<void> {
	await changeQuotaUser(db, collection, email, newEmail)
	let items = await db.collection(collection).find({owners: email},
		{projection: {_id: true, owners: true, quotaUser: true}}
	).toArray()
	for (let item of items) {
		let owners = item.owners.filter((i) => i != email)
		if (item.quotaUser == newEmail) {
			owners.unshift(newEmail)
		} else {
			owners.push(newEmail)
		}
		await db.collection(collection).updateOne({_id: item._id},
			{$set: {owners: owners}}
		)
	}
}