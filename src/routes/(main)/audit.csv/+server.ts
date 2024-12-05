import {verifyAuthentication} from "$lib/security";
import type {RequestHandler} from '@sveltejs/kit';
import { verifyLocalUserIsAdmin } from '$lib/userutils';
import { checkAndFixDb, exportAuditAsCsv } from "$lib/audit"

export const GET: RequestHandler = async function ({locals, params, url}) {
	await verifyAuthentication(locals)
	await verifyLocalUserIsAdmin(locals)
	const fix = url.searchParams.has('fix');
	console.log(`audit${fix ? " and fix" : ""}`)
	await checkAndFixDb(locals.email, fix)
	const csv = await exportAuditAsCsv();
	return new Response(csv, {headers: {'content-type': 'text/csv; charset=utf-8'}})
}

