<script lang="ts">
	import {base} from "$app/paths"
	import type {DesignInfo} from '$lib/analysis'
	import type {Analysis} from "$lib/types"
	import AnalysisHeader from "../AnalysisHeader.svelte";
	import {formatDate} from "$lib/ui/formatutils";

    interface Board {
        sessionName: string
        snapshotDescription: string
        boardId: string
        board: BoardInfo
        created: string
    }
	export let data: {analysis:Analysis, designs: DesignInfo[], boardIds: string[], zoneIds: string[], boards:Board[]}

    function quote(text) {
        return `"${text}"`
    }
</script>

<AnalysisHeader analysis={data.analysis}/>

<div class="w-full flex flex-col text-sm font-medium p-6 gap-4 overflow-scroll">
    <div class=flex>
        Snapshots: {data.designs.length}
    </div>
    <div class="flex">
        Boards: ({data.boardIds.length}) {data.boardIds.map(quote).join(", ")}
    </div>
    <div class="flex">
        Zones: ({data.zoneIds.length}) {data.zoneIds.map(quote).join(", ")}
    </div>
    <table>
        <thead>
            <th>Session</th>
            <th>Snapshot</th>
            <th>Board</th>
            <th>(no zone)</th>
            {#each data.zoneIds as zoneId}
                <th>{zoneId}</th>
            {/each}
        </thead>
        <tbody>
            {#each data.boards as board}
                <tr>
                    <td>{board.sessionName}</td>
                    <td>{board.snapshotDescription}</td>
                    <td>{board.boardId}</td>
                    <td>{board.board.cards.filter((ci) => data.boardIds.includes(ci.zones[0].zoneId)).length}</td>
                    {#each data.zoneIds as zoneId}
                        <td>{board.board.cards.filter((ci) => ci.zones.map((z)=> z.zoneId).includes(zoneId)).length}</td>
                    {/each}    
                </tr>
            {/each}
        </tbody>
    </table>
</div>
<!--
<div class="flex">
    <table>
        <thead>
            <th>Session</th>
            <th>Snapshot</th>
            <th>Board</th>
            <th>...</th>
        </thead>
        <tbody>
            {#each data.boards as board}
                <tr>
                    <td>{board.sessionName}</td>
                    <td>{board.snapshotDescription}</td>
                    <td>{board.boardId}</td>
                    <td>{JSON.stringify(board.board.cards)}</td>
                    <td>{board.board.cards.map((ci)=> ci.id+"("+ci.zones.map((z)=>z.id).join(";")+")").join(", ")}</td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
-->