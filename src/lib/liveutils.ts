import type {SnapshotInfo} from "./analysistypes";
import {SPOTLIGHT_ZONE} from "./liveclient";
import type {KVSet, KVStore} from "./liveclienttypes";

export function getSeatsFromMiro(info: SnapshotInfo): string[] {
	let seats: string[] = []
	for (const board of info.boards) {
		//console.log(`- board ${board.id}`)
		if (board.id && board.id.indexOf('@') >= 0) {
			const seat = board.id.substring(board.id.indexOf('@'))
			if (seats.indexOf(seat) < 0) {
				seats.push(seat)
			}
		}
		for (const zone of board.zones) {
			//console.log(`  - zone ${zone.id}`)
			if (zone.id && zone.id.indexOf('@') >= 0) {
				const seat = zone.id.substring(zone.id.indexOf('@'))
				if (seats.indexOf(seat) < 0) {
					seats.push(seat)
				}
			}
		}
		//console.log(`- board ${board.id} cards:`, JSON.stringify(board.cards))
	}
	seats.sort()
	return seats
}

export function getChangesFromMiroState(info: SnapshotInfo, roomState: KVStore): KVSet[] {
	try {
		let roomChanges: KVSet[] = []
		let seats = getSeatsFromMiro(info)
		let seatsValue = JSON.stringify(seats)
		if (seatsValue != roomState.seats) {
			roomChanges.push({key: 'seats', value: seatsValue})
		}
		let roomKeysToDelete = []
		// players in seats?
		for (const key of Object.keys(roomState)) {
			if (key.substring(0, 7) == 'player:') {
				const seat = key.substring(7)
				if (seats.indexOf(seat) < 0) {
					roomKeysToDelete.push(key)
					console.log(`remove ${key} for unknown seat`)
				}
			}
		}
		let allBoardsInc = info.boards.map((b) => (b.id ?? b.nativeId))
		let allBoards = allBoardsInc.filter((id) => id != '(no board)')
		let allBoardsValue = JSON.stringify(allBoards)
		if (roomState.boards != allBoardsValue) {
			roomChanges.push({key: 'boards', value: allBoardsValue})
		}
		// active board
		let activeBoard = roomState.activeBoard && allBoards.indexOf(roomState.activeBoard) >= 0 ? roomState.activeBoard : (allBoards.length > 0 ? allBoards[0] : undefined)
		if (roomState.activeBoard != activeBoard) {
			roomChanges.push({key: 'activeBoard', value: activeBoard})
		}
		// all zones in boards for now
		let allBoardZones: string[] = []
		for (let board of info.boards) {
			let boardId = (board.id ?? board.nativeId)
			let allZones = board.zones.map((z) => z.id).filter((id) => id && id.length > 0)
			if (boardId != '(no board)') {
				allZones.push(SPOTLIGHT_ZONE)
			}
			allZones = allZones.sort().filter(function (el, i, a) {return i === a.indexOf(el)})
			let activeZonesValue = JSON.stringify(allZones)
			if (roomState[`zones:${boardId}`] != activeZonesValue) {
				roomChanges.push({key: `zones:${boardId}`, value: activeZonesValue})
			}
			// cards in each zone - separate boards
			let boardCards = board.cards
			let boardComments = board.comments
			let boardZones = board.zones.map((z) => z.id).filter((id) => id && id.length > 0)
			boardZones.push(SPOTLIGHT_ZONE)
			boardZones = allZones.sort().filter(function (el, i, a) {return i === a.indexOf(el)})
			for (const zone of boardZones) {
				let zoneCards = boardCards.filter((c) => c.zones && c.zones.filter((cz) => cz.overlap >= 0.5).map((cz) => (cz.zoneId)).indexOf(zone) >= 0).map((c) => c.id).sort()
				let zoneComments = boardComments.filter((c) => c.zones && c.zones.filter((cz) => cz.overlap >= 0.5).map((cz) => (cz.zoneId)).indexOf(zone) >= 0).map((c) => `note:${c.nativeId}:${c.colour}:${c.text}`).sort()
				let cardsValue = JSON.stringify(zoneCards.concat(zoneComments))
				allBoardZones.push(`${boardId}/${zone}`)
				if (roomState[`cards:${boardId}/${zone}`] != cardsValue) {
					roomChanges.push({key: `cards:${boardId}/${zone}`, value: cardsValue})
				}
			}
		}
		for (const key of Object.keys(roomState)) {
			if (key.substring(0, 6) == 'cards:') {
				const zone = key.substring(6)
				if (allBoardZones.indexOf(zone) < 0) {
					roomKeysToDelete.push(key)
					console.log(`remove ${key} for unknown zone`)
				}
			} else if (key.substring(0, 6) == 'zones:') {
				const board = key.substring(6)
				if (allBoardsInc.indexOf(board) < 0) {
					roomKeysToDelete.push(key)
					console.log(`remove ${key} for unknown board`)
				}
			}
		}
		for (const key of roomKeysToDelete) {
			roomChanges.push({key})
		}
		return roomChanges

	} catch (err) {
		console.error(`error processing board`, err)
	}
}