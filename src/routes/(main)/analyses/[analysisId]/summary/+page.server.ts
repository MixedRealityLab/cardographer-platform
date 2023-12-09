import {readDesigns} from '$lib/analysis'
import {verifyAuthentication} from "$lib/security"
import { BoardInfo } from '$lib/types';
import type {PageServerLoad} from "./$types"

function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}

interface Board {
    sessionName: string
    snapshotDescription: string
    boardId: string
    board: BoardInfo
    created: string
}
function compareBoards(a, b) {
    return `${a.sessionName}/${a.boardId}/${a.created}`.localeCompare(`${b.sessionName}/${b.boardId}/${b.created}`)
}

export const load: PageServerLoad = async function ({locals, parent}) {
	verifyAuthentication(locals)
	const analysis = await parent()
    const designs = await readDesigns(analysis)
    const boards:Board[] = designs.flatMap((d) => d.boards.map((b) => {
        return { 
            sessionName: d.snapshot.sessionName, 
            snapshotDescription: d.snapshot.snapshotDescription,
            boardId: b.id,
            board: b,
            created: d.snapshot.created,
        }})).sort(compareBoards)
	return {
		analysis: analysis,
		designs: designs,
        boardIds: designs.flatMap((d) => d.boards.map((b) => b.id)).sort().filter(onlyUnique),
        zoneIds: designs.flatMap((d) => d.boards.flatMap((b) => b.zones.map((z) => z.id))).sort().filter(onlyUnique),
        boards: boards,
	}
}
