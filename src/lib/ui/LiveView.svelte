<script lang="ts">
	import CardList from "$lib/ui/CardList.svelte";
	import LiveViewHeader from "$lib/ui/LiveViewHeader.svelte";
    import type { Session } from "$lib/types"
	import {onDestroy} from "svelte"
	import { base } from "$app/paths";
    import { page } from '$app/stores';  
    import { LiveClient, getLiveClient } from "$lib/liveclient";

    export let session: Session
    export let isOwner: boolean = false

    let nickname = ''
    let tab='cards'

    $: cards = session?.decks?.flatMap(deck => deck['cards']) ?? []
    let cardList: CardList

    let client : LiveClient = getLiveClient(() => { 
        console.log(`updated`); 
        client = client
    })
    $: clients = client.clients
    $: seats = client.seats
    $: players = client.players
    $: connecting = client.connecting
    $: failed = client.failed
    $: connected = client.connected
    
    function connect() {
        client.connect($page.url, base, session, nickname)
    }
    onDestroy(() => {
        console.log(`destroyed live view`)// ??
    })
    function changeSeat(seat) {
        client.changeSeat(seat, players[seat])
    }
</script>

<style>
    .tab {
        @apply px-4 rounded-t py-1 cursor-pointer transition-colors duration-500 text-gray-200;
    }

    .tabSelected {
        @apply bg-gray-300 cursor-default text-gray-900;
    }

    .tab:hover:not(.tabSelected) {
        @apply bg-gray-600;
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
<div class="absolute top-0 bottom-10 left-0 right-0 overflow-y-scroll">
        {#if tab=='cards'}
            <div class="flex flex-col h-full w-screen">
                <CardList cards={cards} bind:this={cardList}></CardList>
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
        <div class="tab" class:tabSelected={tab=='people'} on:click={()=>tab='people'}>
            People
        </div>
        {/if}
</div>
{/if}
