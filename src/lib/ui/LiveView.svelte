<script lang="ts">
	import CardList from "$lib/ui/CardList.svelte";
	import LiveViewHeader from "$lib/ui/LiveViewHeader.svelte";
    import type { Session } from "$lib/types"
	import {onDestroy} from "svelte"
	import { base } from "$app/paths";
    import { page } from '$app/stores';  
    import { LiveClient, getLiveClient, SPOTLIGHT_ZONE } from "$lib/liveclient";
    import ZoneSelector from "./ZoneSelector.svelte";

    export let session: Session
    export let isOwner: boolean = false

    let nickname = ''
    let tab='cards'

    $: cards = session?.decks?.flatMap(deck => deck['cards']) ?? []
    let cardList: CardList

    let client : LiveClient = getLiveClient((c, clientsChanged) => { 
        console.log(`updated ${clientsChanged?'- clients changed': ''}`)
        if (clientsChanged) {
            doHighlightPlayerTab()
        }
        client = client
    })
    let higlightPlayerTab = false
    let highlightPlayerTimeout = null
    function doHighlightPlayerTab() {
        higlightPlayerTab = true
        highlightPlayerTimeout = setTimeout(() => higlightPlayerTab=false, 3000)
    }
    $: clientId = client.clientId
    $: clients = client.clients
    $: seats = client.seats
    $: players = client.players
    $: myseat = Object.entries(players).find((e)=> clientId && e[1]==clientId)?.at(0)
    $: connecting = client.connecting
    $: failed = client.failed
    $: connected = client.connected
    $: activeZones = client.activeZones
    $: myActiveZones = activeZones.filter((z) => (isOwner || z!=SPOTLIGHT_ZONE) && (z.indexOf('@')<0 || z.substring(z.indexOf('@'))==myseat))
    let myzone:string
    $: zoneCards = client.zoneCards
    $: myZoneCards = cards.filter((c) => (zoneCards[myzone] ?? []).indexOf(c.id)>=0)
    let mySelectedIds = []
    $: topZones = isOwner ? activeZones : [SPOTLIGHT_ZONE]
    let topzone:string
    $: topZoneCards = cards.filter((c) => (zoneCards[topzone] ?? []).indexOf(c.id)>=0)

    function connect() {
        client.connect($page.url, base, session, nickname)
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
</style>


{#if failed} 
<div class="absolute top-0 bottom-0 left-0 right-0 overflow-y-scroll overflow-x-hidden">
    <div class="w-full flex flex-col">
        <LiveViewHeader {session}></LiveViewHeader>
        <div class="container mx-auto flex flex-col">
            <div class="text-red-950 bg-red-100 rounded p-4 m-4 text-xl">Sorry, you can't join that session ({failed})</div>
        </div>
    </div>
</div>

{:else if !connected}
<div class="absolute top-0 bottom-0 left-0 right-0 overflow-y-scroll overflow-x-hidden">
    <div class="w-full flex flex-col">
        <LiveViewHeader {session}></LiveViewHeader>
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
</div>
{:else}
<div class="absolute top-0 bottom-10 left-0 right-0" class:overflow-y-auto={tab!='cards'}>
        {#if tab=='cards'}
            <div class="flex flex-col h-full w-screen">
                <ZoneSelector zones={topZones} bind:zone={topzone}></ZoneSelector>
                <div class="w-full h-10 py-1 px-2 bg-gray-300 text-gray-900 stroke-gray-900 text-xl flex justify-center items-center">
                    <div class="flex justify-center arrow px-2" class:disabled={mySelectedIds.length==0 || myzone==topzone || !myZoneCards.find((c)=>mySelectedIds.indexOf(c.id)>=0)}
                    on:click={(ev)=>{if(!(mySelectedIds.length==0 || myzone==topzone)) { moveSelectionUp(ev) }}}>
                        <svg class="w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="flex justify-center arrow px-2" class:disabled={mySelectedIds.length==0 || myzone==topzone || !topZoneCards.find((c)=>mySelectedIds.indexOf(c.id)>=0)}
                        on:click={(ev)=>{if(!(mySelectedIds.length==0 || myzone==topzone)) { moveSelectionDown(ev) }}}>
                        <svg class="w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </div>
                </div>
                <ZoneSelector zones={myActiveZones} bind:zone={myzone}></ZoneSelector>
                <CardList cards={myZoneCards} bind:this={cardList}
                allowSelection={true} bind:selectedIds={mySelectedIds}></CardList>
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
                </label>
                </form>
            </div>
        </div>
        {/if}
</div>
<div class="absolute bottom-0 h-10 w-full pt-1 pb-0 bg-gray-700 flex flex-wrap text-white justify-center text-center overflow-x-auto">
        <div class="tab" class:tabSelected={tab=='cards'} on:click={()=>tab='cards'}>
            Cards
        </div>
        {#if isOwner}
        <div class="tab" class:highlight={higlightPlayerTab} class:tabSelected={tab=='people'} on:click={()=>tab='people'}>
            People
        </div>
        {/if}
</div>
{/if}
