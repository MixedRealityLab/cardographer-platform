<script lang="ts">
	import CardList from "$lib/ui/CardList.svelte";
	import LiveViewHeader from "$lib/ui/LiveViewHeader.svelte";
    import type { Session } from "$lib/types"
	import {onMount, onDestroy} from "svelte"
	import { base } from "$app/paths";
    import { page } from '$app/stores';  
    import { LiveClient, getLiveClient, SPOTLIGHT_ZONE } from "$lib/liveclient";
    import ZoneSelector from "./ZoneSelector.svelte";
	import type {Miro} from "@mirohq/websdk-types";

	declare const miro: Miro
    export let session: Session
    export let isOwner: boolean = false
    export let inmiro: boolean = false

    let nickname = ''
    let tab='cards'

    $: cards = session?.decks?.flatMap(deck => deck['cards']) ?? []
    let cardList: CardList
    let topCardList: CardList

    let oldSeat = ''
    let client : LiveClient = getLiveClient((c, clientsChanged) => { 
        console.log(`updated ${clientsChanged?'- clients changed': ''}`)
        if (clientsChanged) {
            doHighlightPlayerTab()
        }
        let newSeat = Object.entries(c.players).find((e)=> c.clientId && e[1]==c.clientId)?.at(0) as string
        if (newSeat && newSeat != oldSeat) {
            oldSeat = newSeat
            tab = 'hand'
        }
        // kick everything...
        client = client
    })
    let higlightPlayerTab = false
    let highlightPlayerTimeout = null
    function doHighlightPlayerTab() {
        higlightPlayerTab = true
        highlightPlayerTimeout = setTimeout(() => higlightPlayerTab=false, 3000)
    }
    $: readonly = client.readonly
    $: clientId = client.clientId
    $: clients = client.clients
    $: numberReadonly = client.numberReadonly
    $: seats = client.seats
    $: players = client.players
    $: myseat = Object.entries(players).find((e)=> clientId && e[1]==clientId)?.at(0)
    $: connecting = client.connecting
    $: failed = client.failed
    $: connected = client.connected
    $: spotlights = client.spotlights
    $: activeZones = client.activeZones
    $: myActiveZones = activeZones.filter((z) => tab=='allcards' ? true : z!=SPOTLIGHT_ZONE && ((tab=='cards' && z.indexOf('@')<0) || (tab=='hand' && z.substring(z.indexOf('@'))==myseat)))
    let myzone:string
    $: zoneCards = client.zoneCards
    $: myZoneCards = cards.filter((c) => (zoneCards[myzone] ?? []).indexOf(c.id)>=0)
    let mySelectedIds = []
    $: topZones = tab=='allcards' ? activeZones : [SPOTLIGHT_ZONE]
    let topzone:string
    $: topZoneCards = cards.filter((c) => (zoneCards[topzone] ?? []).indexOf(c.id)>=0)
    let split = 0
    let bottomDrawerHeight = 100
    let midBarHeight = 32
    let zoneSelectorHeight = 32
    $: spotlight = (tab=='cards'||tab=='hand') && cards.find((c)=>(zoneCards[SPOTLIGHT_ZONE]??[]).indexOf(c.id)>=0)

    function connect() {
        const joiningCode = $page.url.searchParams.get('j') ?? isOwner ? session.joiningCode : session.joiningCodeReadonly
        client.connect($page.url, base, session, nickname, joiningCode, inmiro ? miro : null)
    }
    onDestroy(() => {
        if (highlightPlayerTimeout) {
            clearTimeout(highlightPlayerTimeout)
            highlightPlayerTimeout = null
        }
    })
    function changeSeat(seat) {
        client.changeSeat(seat, players[seat])
    }

    function moveSelectionUp(ev: MouseEvent) {
        client.moveCards(mySelectedIds, myzone, topzone)
    }
    function moveSelectionDown(ev: MouseEvent) {
        client.moveCards(mySelectedIds, topzone, myzone)
    }
</script>

<style>
	@keyframes highlight {
		0% {
			outline: 2px ridge #24F8;
            @apply bg-gray-500;
        }
		25% {
			outline: 2px ridge #24F8;
            @apply bg-gray-500;
		}
		100% {
			outline: 2px ridge #24F0;
		}
	}
	.highlight {
		animation: highlight 3s;
	}
    .tab {
        @apply px-4 rounded-t py-1 cursor-pointer transition-colors duration-500 text-gray-200;
    }

    .tabSelected {
        @apply bg-gray-300 cursor-default text-gray-900;
    }

    .tab:hover:not(.tabSelected) {
        @apply bg-gray-600;
    }

    .arrow {
        @apply cursor-pointer text-gray-900 stroke-gray-900;
    }

    .arrow.disabled {
        @apply cursor-default text-gray-400 stroke-gray-400;
    }

    .arrow:hover:not(.disabled) {
        @apply text-gray-600 stroke-gray-600;
    }

    .split-50 {
        top: 45%;
    }

</style>

<div class="absolute top-0 bottom-10 left-0 right-0 overflow-x-hidden bg-gray-100" 
class:overflow-y-auto={failed || !connected || (tab!='cards' && tab!='allcards' && tab!='hand')} 
class:overflow-y-hidden={!failed && connected && (tab=='cards' || tab=='allcards' || tab=='hand')}>

{#if inmiro && tab=='miro'}
    <slot></slot>
{:else if failed} 
    <div class="w-full flex flex-col">
        {#if !inmiro}
        <LiveViewHeader {session}></LiveViewHeader>
        {/if}
        <div class="container mx-auto flex flex-col">
            <div class="text-red-950 bg-red-100 rounded p-4 m-4 text-xl">Sorry, you can't join that session ({failed})</div>
        </div>
    </div>

{:else if !connected}
    <div class="w-full flex flex-col">
        {#if !inmiro}
        <LiveViewHeader {session}></LiveViewHeader>
        {/if}
        <div class="container mx-auto flex flex-col">
            <div class="flex flex-col p-2">
                <div class="flex m-2">
                    <input class="flex-grow" type="text" bind:value={nickname} placeholder="Nickname" disabled={connecting}>
                </div>
                <div class="flex m-2 self-center w-full p-2">
                    <button class="w-full button self-center" disabled={connecting || nickname==''} on:click={connect}>Join</button>
                </div>
            </div>
        </div>
    </div>
{:else}
        {#if tab=='cards' || tab=='allcards' || tab=='hand'}
        <div class="absolute top-0 bottom-10 left-0 right-0 z-0">
            <div class="flex flex-col h-full w-screen">
                <ZoneSelector zones={topZones} bind:zone={topzone}></ZoneSelector>
                <CardList cards={topZoneCards} bind:this={topCardList}
                allowSelection={!readonly} bind:selectedIds={mySelectedIds}
                comments={topzone==SPOTLIGHT_ZONE ? spotlights : {}}></CardList>
            </div>
        </div>
        <div class="absolute top-10 bottom-0 left-0 right-0 z-10 pointer-events-none">
            <div id="bottomDrawer" bind:clientHeight={bottomDrawerHeight} 
                class="pointer-events-auto flex flex-col h-full w-screen bg-gray-100" class:relative={split>0} class:split-50={split==50}
                style:top={split==0 && !spotlight ? '0' : ''+(((bottomDrawerHeight??100)*(spotlight?100:split)/100)-midBarHeight-zoneSelectorHeight)+'px'}>
                <div bind:clientHeight={midBarHeight} class="relative w-full h-10 py-1 px-2 bg-gray-300 text-gray-900 stroke-gray-900 text-xl flex justify-center items-center">
                    <div class="absolute inset-50"><div class="flex">
                        <div class="flex justify-center arrow px-2" class:disabled={readonly ||mySelectedIds.length==0 || myzone==topzone || !myZoneCards.find((c)=>mySelectedIds.indexOf(c.id)>=0)}
                        on:click={(ev)=>{if(!(readonly || mySelectedIds.length==0 || myzone==topzone)) { moveSelectionUp(ev) }}}>
                            <svg class="w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="flex justify-center arrow px-2" class:disabled={readonly || mySelectedIds.length==0 || myzone==topzone || !topZoneCards.find((c)=>mySelectedIds.indexOf(c.id)>=0)}
                            on:click={(ev)=>{if(!(readonly || mySelectedIds.length==0 || myzone==topzone)) { moveSelectionDown(ev) }}}>
                            <svg class="w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </div>
                    </div></div>
                    <div class="absolute right-0"><div class="flex">
                        <div class="float-right justify-center arrow px-2"
                            on:click={()=>{split=0}} class:disabled={split==0 || spotlight}>
                            <svg  class="w-6" fill="currentColor" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
                                <path d="m 172,738 h 656 q 19,0 33,14 14,14 14,34 v 22 q 0,20 -14,33.5 Q 847,855 828,855 H 172 Q 153,855 139,841.5 125,828 125,808 v -22 q 0,-20 14,-34 14,-14 33,-14 z"/>
                                <path d="m 172,145 h 656 q 19,0 33,13.5 14,13.5 14,33.5 v 22 q 0,20 -14,34 -14,14 -33,14 H 172 q -19,0 -33,-14 -14,-14 -14,-34 v -22 q 0,-20 14,-33.5 14,-13.5 33,-13.5 z" />
                                <path d="m 172,277.93839 h 656 q 19,0 33,13.5 14,13.5 14,33.5 v 16 q 0,20 -14,33.5 -14,13.5 -33,13.5 H 172 q -19,0 -33,-13.5 -14,-13.5 -14,-33.5 v -16 q 0,-20 14,-33.5 14,-13.5 33,-13.5 z" />
                            </svg>
                        </div>
                        <div class="float-right  justify-center arrow px-2"
                            on:click={()=>{split=50}} class:disabled={split==50 || spotlight}>
                            <svg  class="w-6" fill="currentColor" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
                                <path d="M172 445h656q19 0 33 13.5t14 33.5v16q0 20-14 33.5T828 555H172q-19 0-33-13.5T125 508v-16q0-20 14-33.5t33-13.5zm0-300h656q19 0 33 13.5t14 33.5v22q0 20-14 34t-33 14H172q-19 0-33-14t-14-34v-22q0-20 14-33.5t33-13.5zm0 593h656q19 0 33 14t14 34v22q0 20-14 33.5T828 855H172q-19 0-33-13.5T125 808v-22q0-20 14-34t33-14z"/>
                            </svg>
                        </div>
                        <div class="float-right  justify-center arrow px-2"
                            on:click={()=>{split=100}} class:disabled={split==100 || spotlight}>
                            <svg  class="w-6" fill="currentColor" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
                                <path d="m 172,738 h 656 q 19,0 33,14 14,14 14,34 v 22 q 0,20 -14,33.5 Q 847,855 828,855 H 172 Q 153,855 139,841.5 125,828 125,808 v -22 q 0,-20 14,-34 14,-14 33,-14 z" />
                            <path d="m 172,145 h 656 q 19,0 33,13.5 14,13.5 14,33.5 v 22 q 0,20 -14,34 -14,14 -33,14 H 172 q -19,0 -33,-14 -14,-14 -14,-34 v -22 q 0,-20 14,-33.5 14,-13.5 33,-13.5 z" />
                            <path d="m 167.26066,616.80095 h 656 q 19,0 33,13.5 14,13.5 14,33.5 v 16 q 0,20 -14,33.5 -14,13.5 -33,13.5 h -656 q -19,0 -33,-13.5 -14,-13.5 -14,-33.5 v -16 q 0,-20 14,-33.5 14,-13.5 33,-13.5 z" />                        </svg>
                        </div>
                    </div></div>
                </div>
                <div bind:clientHeight={zoneSelectorHeight}>
                    <ZoneSelector zones={myActiveZones} bind:zone={myzone}></ZoneSelector>
                </div>
                <CardList cards={myZoneCards} bind:this={cardList}
                allowSelection={!readonly} bind:selectedIds={mySelectedIds}
                comments={myzone==SPOTLIGHT_ZONE ? spotlights : {}}></CardList>
            </div>
        </div>
        {:else if tab=='people' && isOwner}
        <div class="flex flex-col">
            <LiveViewHeader {session}></LiveViewHeader>
            <div class="max-w-screen-md container mx-auto">
                <form class="p-6 flex flex-col gap-4">
                {#each seats as seat (seat)}
                    <label>
                        <span class="text-sm">{seat}:</span> <!--bind:value="{data.session.name}"-->
                        <select id="{seat}" bind:value="{players[seat]}" class="mt-1 block w-full" on:change="{changeSeat(seat)}">
                            <option value=""></option>
                            {#each clients as clientInfo (clientInfo.clientId)}
                            <option value={clientInfo.clientId}>{clientInfo.clientState?.nickname}</option>
                            {/each}
                        </select>
                    </label>
                {/each}
                <label>
                    <span class="text-sm">All:</span>
                    {#each clients as clientInfo (clientInfo.clientId)}
                    <div class="p-1 m-1 text-base text-black">{clientInfo.clientState?.nickname} <span class="text-sm text-slate-500">({clientInfo.clientId})</span></div>
                    {/each}
                    <div class="p-1 m-1 text-sm text-slate-500">Readonly: {numberReadonly}</div>                   
                </label>
                </form>
            </div>
        </div>
        {/if}
{/if}
</div>
<div class="absolute bottom-0 h-10 z-20 w-full pt-1 pb-0 bg-gray-700 flex flex-wrap text-white justify-center text-center overflow-x-auto">
    {#if !failed && connected}
        <div class="tab" class:tabSelected={tab=='cards'} on:click={()=>tab='cards'}>
            Cards
        </div>
        {#if !readonly}
        <div class="tab" class:tabSelected={tab=='hand'} on:click={()=>tab='hand'}>
            Hand
        </div>
        {/if}
        {#if isOwner}
        <div class="tab" class:tabSelected={tab=='allcards'} on:click={()=>tab='allcards'}>
            All
        </div>
        <div class="tab" class:highlight={higlightPlayerTab} class:tabSelected={tab=='people'} on:click={()=>tab='people'}>
            People
        </div>
        {/if}
    {:else}
        <div class="tab" class:tabSelected={tab!='miro'} on:click={()=>tab='cards'}>
            Live
        </div>
    {/if}
    {#if inmiro}
        <div class="tab" class:tabSelected={tab=='miro'} on:click={()=>tab='miro'}>
            Session
        </div>
    {/if}
</div>
