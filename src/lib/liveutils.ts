import type { SnapshotInfo } from "./analysistypes";
import { SPOTLIGHT_ZONE } from "./liveclient";
import type { KVSet, KVStore } from "./liveclienttypes";

export function getSeatsFromMiro(info: SnapshotInfo) : string[] {
    let seats : string[] = []
    for (const board of info.boards) {
        //console.log(`- board ${board.id}`)
        if (board.id && board.id.indexOf('@')>=0) {
            const seat = board.id.substring(board.id.indexOf('@'))
            if (seats.indexOf(seat)<0) {
                seats.push(seat)
            }
        }
        for (const zone of board.zones) {
            //console.log(`  - zone ${zone.id}`)
            if (zone.id && zone.id.indexOf('@')>=0) {
                const seat = zone.id.substring(zone.id.indexOf('@'))
                if (seats.indexOf(seat)<0) {
                    seats.push(seat)
                }    
            }
        }
        //console.log(`- board ${board.id} cards:`, JSON.stringify(board.cards))
    }
    return seats
}

export function getChangesFromMiroState(info:SnapshotInfo, roomState:KVStore) : KVSet[] {
    let roomChanges:KVSet[] = []
    let seats = getSeatsFromMiro(info)
    let seatsValue = JSON.stringify(seats)
    if (seatsValue!=roomState.seats) {
        roomChanges.push({key: 'seats', value: seatsValue})
    }
    let roomKeysToDelete = []
    // players in seats?
    for (const key of Object.keys(roomState)) {
        if (key.substring(0,7)=='player:') {
            const seat = key.substring(7)
            if (seats.indexOf(seat)<0) {
                roomKeysToDelete.push(key)
                console.log(`remove ${key} for unknown seat`)
            }
        }
    }
    // all zones active for now
    let allZones = info.boards.flatMap((b) => b.zones).map((z) => z.id)
    allZones.push(SPOTLIGHT_ZONE)
    allZones = allZones.sort().filter(function(el,i,a){return i===a.indexOf(el)})
    let activeZonesValue = JSON.stringify(allZones)
    if (roomState.activeZones!=activeZonesValue ) {
        roomChanges.push({key: 'activeZones', value: activeZonesValue})
    }
    // cards in each zone - merge boards for now
    let allCards = info.boards.flatMap((b) => b.cards)
    for (const zone of allZones) {
        let zoneCards = allCards.filter((c) => c.zones && c.zones.filter((cz)=>cz.overlap>=0.5).map((cz)=>(cz.zoneId)).indexOf(zone)>=0).map((c) => c.id).sort()
        let cardsValue = JSON.stringify(zoneCards)
        if (roomState[`cards:${zone}`] != cardsValue) {
            roomChanges.push({key: `cards:${zone}`, value: cardsValue})
        }
    }
    for (const key of Object.keys(roomState)) {
        if (key.substring(0,6)=='cards:') {
            const zone = key.substring(6)
            if (allZones.indexOf(zone)<0) {
                roomKeysToDelete.push(key)
                console.log(`remove ${key} for unknown zone`)
            }
        }
    }
    for (const key of roomKeysToDelete) {
        roomChanges.push({key})
    }    
    return roomChanges
}