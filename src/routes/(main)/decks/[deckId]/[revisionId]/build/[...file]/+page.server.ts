import {buildRevision, getFileInfo, writeToFile} from "$lib/builders";
import {getDb} from "$lib/db";
import {getRevision} from "$lib/decks";
import {verifyAuthentication} from "$lib/security"
import type {CardDeckRevision} from "$lib/types";
import {DeckBuildStatus} from "$lib/types";
import {error} from "@sveltejs/kit";
import type {Db} from "mongodb";
import type {Actions, PageServerLoad} from './$types'
import { getDiskSizeK } from "$lib/builders";
import { getQuotaDetails, getUsageDiskSizeK } from "$lib/quotas";

export const load: PageServerLoad = async function ({locals, params, parent}) {
	await verifyAuthentication(locals)
	const {deckId, revisionId, file} = params
	const layout = await parent()
	const quota = await getQuotaDetails(locals.email)
	const usageDiskSizeK = await getUsageDiskSizeK(locals.email)
	try {
		const files = await getFileInfo(deckId, revisionId, file);
		return {
			revision: layout.revision,
			files: files,
			overQuota: usageDiskSizeK > quota.quota.diskSizeK,
			usageDiskSizeK,
			quotaDiskSizeK: quota.quota.diskSizeK,
		}
	} catch (err) {
		throw error(500, `error getting file ${deckId}/${revisionId}/${file}: ${err.message}`)
	}
}

async function build(db: Db, revision: CardDeckRevision) {
	try {
		const result = await buildRevision(revision)
		console.log(result)
		// update revision
		if (!result.error && result.cards) {
			for (const card of result.cards) {
				const update = revision.cards.find((c) => c.id == card.id);
				if (!update) {
					console.log(`Error: could not find card ${card.id} to update`);
					continue;
				}
				for (const k in card) {
					update[k] = card[k];
				}
			}
		}
		const now = new Date().toISOString();
		if (result.error) {
			result.messages.splice(0, 0, result.error)
		}
		revision.build.status = (result.error ? DeckBuildStatus.Failed : DeckBuildStatus.Built)
		revision.build.messages = result.messages
		revision.build.lastBuilt = now
		revision.lastModified = now
		revision.output = {isUserModified: false, atlases: result.atlases}
		revision.diskSizeK = await getDiskSizeK(revision.deckId, String(revision.revision))
		await db.collection<CardDeckRevision>('CardDeckRevisions').replaceOne({_id: revision._id}, revision)
		console.log(result)
	} catch (e) {
		console.log(e)
		console.trace()
		revision.build.status = DeckBuildStatus.Failed
		revision.build.messages = ["Build Failed", e.toString()]
		const now = new Date().toISOString();
		revision.build.lastBuilt = now
		revision.lastModified = now
		revision.diskSizeK = await getDiskSizeK(revision.deckId, String(revision.revision))
		await db.collection<CardDeckRevision>('CardDeckRevisions').replaceOne({_id: revision._id}, revision)
	}
}

export const actions: Actions = {
	upload: async ({locals, params, request}) => {
		await verifyAuthentication(locals)
		const {deckId, revisionId} = params
		const db = await getDb();
		// permission check
		const revision = await getRevision(db, deckId, Number(revisionId), locals.email)
		if (revision.isLocked) {
			throw error(401)
		}
		const path = params.file;

		const data = await request.formData();
		const files = data.getAll('files') as File[]
		for (const file of files) {
			await writeToFile(deckId, revisionId, path, file);
		}
		const diskSizeK = await getDiskSizeK(deckId, revisionId)
		await db.collection<CardDeckRevision>("CardDeckRevisions").updateOne({
			_id: revision._id
		}, {
			$set: {
				diskSizeK: diskSizeK,
			}
		})
		try {
			return {success: true}
		} catch (err) {
			throw error(500, `error getting file ${deckId}/${revisionId}/${path}: ${err.message}`)
		}
	},
	build: async ({locals, params}) => {
		await verifyAuthentication(locals)
		const {deckId, revisionId} = params
		const db = await getDb()
		const revision = await getRevision(db, deckId, Number(revisionId), locals.email)
		if (!revision.build) {
			revision.build = {
				builderId: "squib",
				builderName: "squib",
				isDisabled: false,
				status: DeckBuildStatus.Unbuilt
			}
		}
		if (revision.build.isDisabled) {
			throw error(401)
		}
		// build...
		revision.build.status = DeckBuildStatus.Building
		await db.collection<CardDeckRevision>('CardDeckRevisions').replaceOne({_id: revision._id}, revision)
		build(db, revision).then()
		return revision
	}
}