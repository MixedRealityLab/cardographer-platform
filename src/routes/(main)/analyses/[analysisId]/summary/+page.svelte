<script lang="ts">
	import {base} from "$app/paths"
	import type {DesignInfo} from '$lib/analysis'
	import type {Analysis, Session, CardDeckRevision} from "$lib/types"
	import AnalysisHeader from "../AnalysisHeader.svelte";
	import {formatDate} from "$lib/ui/formatutils";
    import type {BoardInfo} from "$lib/analysistypes"

    interface Board {
        session: Session
        snapshotDescription: string
        boardId: string
        board: BoardInfo
        created: string
    }
    /** @type {import('./$types').PageData} */
	export let data;
    //: {analysis:Analysis, designs: DesignInfo[], boardIds: string[], zoneIds: string[], 
    //   boards:Board[], sessionIds:string[], sessions:Session[], decks:CardDeckRevision[]}

    function quote(text) {
        return `"${text}"`
    }
    function onlyUnique(value, index, array) {
        return array.indexOf(value) === index;
    }
    function hideZero(value:number) {
        return value==0 ? '' : (value-Math.round(value)) == 0 ? value : value.toFixed(1)
    }
    function hideOneBrackets(value:number) {
        return value==1 ? '' : '('+((value-Math.round(value)) == 0 ? value : value.toFixed(1))+')'
    }
    function sum(a:number, b:number): number {
        return a+b;
    }
</script>

<AnalysisHeader analysis={data.analysis}/>

<div class="w-full flex flex-col text-sm font-medium p-6 gap-4 overflow-scroll">
    <div class="subheader">Sessions</div>
    <div class=flex>
        Sessions: {data.sessions.length}<br/>
        Snapshots: {data.designs.length}
    </div>
    <table class="analysis-table">
        <thead>
            <th>ID</th>
            <th>Name</th>
            <th>Snapshots</th>
            <th>Consent for:<br/> Stats</th>
            <th>Text</th>
            <th>Identity</th>
            <th>Acknowledge?</th>
        </thead>
        <tbody>
            {#each data.sessions as session, i}
                <tr>
                    <td>S{i+1}</td>
                    <td>{session.name}</td>
                    <td>{data.designs.filter((d) => d.session._id == session._id).length}</td>
                    <td>{session.isConsentForStats ? 'Yes' : 'No' }</td>
                    <td>{session.isConsentForText ? 'Yes' : 'No' }</td>
                    <td>{session.isConsentToIdentify ? 'Yes' : 'No' }</td>
                    <td>{session.isConsentRequiresCredit ? 'Yes' : 'No' }</td>
                </tr>
            {/each}
            <tr>
                <td><em>Total</em></td>
                <td></td>
                <td>{data.designs.length}</td>
                <td>{data.sessions.filter((s) => s.isConsentForStats).length}</td>
                <td>{data.sessions.filter((s) => s.isConsentForText).length}</td>
                <td>{data.sessions.filter((s) => s.isConsentToIdentify).length}</td>
                <td>{data.sessions.filter((s) => s.isConsentRequiresCredit).length}</td>
            </tr>
        </tbody>
    </table>
    <div class="subheader">Boards</div>
    <div class="flex">
        Boards: {data.boardIds.length} 
    </div>
    <table class="analysis-table">
        <thead>
            <th>ID</th>
            <th>Board</th>
        </thead>
        {#each data.boardIds as boardId, i}
            <tr>
                <td>B{i+1}</td>
                <td>{boardId}</td>
            </tr>
        {/each}
    </table>
    <div class="subheader">Zones/regions</div>
    <div class="flex">
        Zones: {data.zoneIds.length}
    </div>
    <table class="analysis-table">
        <thead>
            <th>ID</th>
            <th>Zone</th>
        </thead>
        {#each data.zoneIds as zoneId, i}
            <tr>
                <td>Z{i+1}</td>
                <td>{zoneId}</td>
            </tr>
        {/each}
    </table>
    <div class="flex">Counts of whole/part in board/zone: cards, comments (Cs)</div>
    <table class="analysis-table">
        <thead>
            <th>Board</th>
            <th>Session</th>
            <th>Snapshot</th>
            <th>Total (cards)</th>
            <th>(Cs)</th>
            <th>No zone</th>
            <th>Cs</th>
            {#each data.zoneIds as zoneId}
                <th>Z{data.zoneIds.indexOf(zoneId)+1}</th>
                <th>Cs</th>
            {/each}
        </thead>
        <tbody>
            {#each data.boards as board}
                <tr>
                    <td>{board.boardId}</td>
                    <td>S{data.sessionIds.indexOf(board.session._id)}</td>
                    <td>{board.snapshotDescription}</td>
                    <td>{hideZero(board.board.cards.length)}</td>
                    <td>{hideZero(board.board.comments.length)}</td>
                    <td>{hideZero(board.board.cards.filter((ci) => data.boardIds.includes(ci.zones[0].zoneId)).length)}</td>
                    <td>{hideZero(board.board.comments.filter((ci) => data.boardIds.includes(ci.zones[0].zoneId)).length)}</td>
                    {#each data.zoneIds as zoneId}
                        <td class="{board.board.zones.find((z)=>z.id==zoneId) ? '' : 'not-possible'}">
                            {hideZero(board.board.cards.map((ci) => ci.zones.map((z)=> z.zoneId==zoneId ? z.overlap: 0).reduce(sum,0)).reduce(sum,0))}
                        </td>  
                        <td class="{board.board.zones.find((z)=>z.id==zoneId) ? '' : 'not-possible'}">
                            {hideZero(board.board.comments.map((ci) => ci.zones.map((z)=> z.zoneId==zoneId ? z.overlap: 0).reduce(sum,0)).reduce(sum,0))}
                        </td>  
                    {/each}    
                </tr>
            {/each}
        </tbody>
    </table>
    <div class="subheader">Decks/Cards</div>
    <div class="flex">Decks: {data.decks.length}</div>
    <table class="analysis-table">
        <thead>
            <th>Deck</th>
            <th>Categories</th>
            <th>Cards in deck</th>
            <!--<th>Distinct cards used</th>
            <th>Total cards used</th>-->
        </thead>
        <tbody>
        {#each data.decks as deck}
            <tr>
                <td>{deck.deckName}</td>
                <td>{deck.cards.map((c) => c.category || '').filter(onlyUnique).length}</td>
                <td>{deck.cards.filter((c) => c.id.indexOf('back:')!=0).length}</td>
            </tr>
        {/each}
        {#if data.usedCardIds.filter((id) => !data.deckCardIds.includes(id)).length > 0}
            <tr>
                <td>(unknown)</td>
                <td>(unknown)</td>
                <td>{data.usedCardIds.filter((id) => !data.deckCardIds.includes(id)).length}</td>
            </tr>
        {/if}
        </tbody>
    </table>
    <div class="flex">Cards used:</div>
    <table class="analysis-table">
        <thead>
            <th>ID</th>
            <th>Card</th>
            <th>Category</th>
            <th>Uses (total)</th>
            <th>(no zone)</th>
            {#each data.zoneIds as zoneId, i}
                <th>Z{i}</th>
            {/each}
        </thead>
        {#each data.decks as deck}
            {#each deck.cards as card}
                {#if card.id.indexOf('back:')!=0 && data.boards.flatMap((b) => b.board.cards.filter((c) => c.id == card.id)).length>0}
                    <tr>
                        <td>{card.id}</td>
                        <td>{card.name}</td>
                        <td>{card.category}</td>
                        <td>{hideZero(data.boards.flatMap((b) => b.board.cards.filter((c) => c.id == card.id)).length)}</td>
                        <td>{hideZero(data.boards.flatMap((b) => b.board.cards.filter((ci) => ci.id == card.id && data.boardIds.includes(ci.zones[0].zoneId))).length)}</td>
                        {#each data.zoneIds as zoneId, i}
                            <td>{hideZero(data.boards.map((b) => b.board.cards.map((ci) => ci.id != card.id ? 0 : ci.zones.map((z)=> z.zoneId==zoneId ? z.overlap: 0).reduce(sum,0)).reduce(sum,0)).reduce(sum,0))}</td>
                        {/each}
                    </tr>
                {/if}
            {/each}
        {/each}
        {#each data.usedCardIds.filter((id) => !data.deckCardIds.includes(id)) as cardId}
            <tr>
                <td>{cardId}</td>
                <td>?</td>
                <td>?</td>
                <td>{hideZero(data.boards.flatMap((b) => b.board.cards.filter((c) => c.id == cardId)).length)}</td>
                <td>{hideZero(data.boards.flatMap((b) => b.board.cards.filter((ci) => ci.id == cardId && data.boardIds.includes(ci.zones[0].zoneId))).length)}</td>
                {#each data.zoneIds as zoneId, i}
                    <td>{hideZero(data.boards.map((b) => b.board.cards.map((ci) => ci.id != cardId ? 0 : ci.zones.map((z)=> z.zoneId==zoneId ? z.overlap: 0).reduce(sum,0)).reduce(sum,0)).reduce(sum,0))}</td>
                {/each}
            </tr>
        {/each}
    </table>
    <div class="subheader">Details</div>
    <table class="analysis-table">
        <thead>
            <th>Session</th>
            <th>Snapshot</th>
            <th>Board</th>
            <th>Zone</th>
            <th>Cards</th>
            <th>Comments</th>
        </thead>
        <tbody>
            {#each data.boards as board}
                {#each [{id:board.boardId}].concat(board.board.zones) as zone, zi}
                    <tr>
                        <td>S{data.sessionIds.indexOf(board.session._id)+1}</td>
                        <td>{board.snapshotDescription}</td>
                        <td>{board.boardId}</td>
                        <td>{zi==0 ? '(no zone)' : zone.id}</td>
                        <td>
                            {#each board.board.cards.filter((ci) => ci.zones.map((z)=> z.zoneId).includes(zone.id)) as card}
                                {card.id}
                                {hideOneBrackets(card.zones.map((z) => z.zoneId != zone.id ? 0 : z.overlap).reduce(sum,0))}
                                <br/>
                            {/each}
                        </td>
                        <td>
                            {#each board.board.comments.filter((ci) => ci.zones.map((z)=> z.zoneId).includes(zone.id)) as comment}
                                {quote(comment.text)}
                                {hideOneBrackets(comment.zones.map((z) => z.zoneId != zone.id ? 0 : z.overlap).reduce(sum,0))}
                                <br/>
                            {/each}
                        </td>
                    </tr>
                {/each}
            {/each}
        </tbody>
    </table>
</div>

<style>
    .analysis-table, td, th {
        border: 1px solid;
        border-color: #bbb;
        padding-left: 0.2rem;
        padding-right: 0.2rem;
    }
    th {
        text-align: left;
    }
    td.not-possible {
        background-color: #ddd;
    }
</style>