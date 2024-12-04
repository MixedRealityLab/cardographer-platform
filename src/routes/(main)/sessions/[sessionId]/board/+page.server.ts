import {readBoard} from "$lib/csvutils";
import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security"
import type {Session} from "$lib/types"
import type {Actions} from "@sveltejs/kit"
import {error, fail, json} from "@sveltejs/kit";
import {parse} from "csv";

export const actions: Actions = {
	default: async ({locals, request, params}) => {
		await verifyAuthentication(locals)
		const {sessionId} = params;
		const db = await getDb();
		// permission check
		const session = await db.collection<Session>('Sessions').findOne({
			_id: sessionId, owners: locals.email
		})
		if (!session) {
			throw error(404);
		}
		const data = await request.formData();
		const board = data.get('board') as File
		if (!board) {
			return fail(400)
		}
		const csv = await board.text()

		// parse CSV file
		const cells: string[][] = await new Promise((resolve) => {
			parse(csv, {bom: true, columns: false, trim: true},
				(err, output) => {
					if (err) {
						return {status: 400};
					}
					//console.log(`csv:`, output);
					resolve(output);
				});
		});
		session.board = readBoard(cells)
		session.lastModified = new Date().toISOString()
		const upd = await db.collection<Session>('Sessions').updateOne({
			_id: sessionId
		}, {
			$set: {
				// project changes
				lastModified: session.lastModified,
				board: session.board
			}
		});
		if (!upd.matchedCount) {
			throw error(404);
		}
		return json({
			session: session as any
		})
	}
}