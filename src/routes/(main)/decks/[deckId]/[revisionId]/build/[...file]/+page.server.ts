import {getFileInfo, writeToFile} from "$lib/builders"
import {getDb} from "$lib/db"
import {getRevision} from "$lib/decks"
import {verifyAuthentication} from "$lib/security"
import type {CardDeckRevision} from "$lib/types"
import {error} from "@sveltejs/kit"
import type {Actions, PageServerLoad} from './$types'
import { getDiskSizeK } from "$lib/builders"
import { getQuotaDetails, getUsageDiskSizeK } from "$lib/quotas"

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
	}
}