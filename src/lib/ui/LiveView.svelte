<script lang="ts">
	import CardList from "$lib/ui/CardList.svelte";
    import type { Session } from "$lib/types"
	import {onMount} from "svelte"
	import { base } from "$app/paths";
    import { page } from '$app/stores';  

    export let session: Session
    let connecting = false
    let failed: string|null = null
    let connected = false
    let nickname = ''
    let tab='cards'

    $: cards = session?.decks?.flatMap(deck => deck['cards']) ?? []
    let cardList: CardList

    let clientId: string
    function connect() {
        const wsurl = `${$page.url.protocol == 'https' ? 'wss' : 'ws'}://${$page.url.host}/${base}wss`
        console.log(`connect to ${wsurl}...`)
        connecting = true
        let ws = new WebSocket(wsurl)
        ws.onerror = (event) => { 
            console.log(`ws error`, event) 
            failed = `websocket error ${event.error}`;
        }
        ws.onclose = (event) => { 
            console.log(`ws close`, event) 
            failed = `websocket closed`
        }
        ws.onmessage = (event) => {
            console.log(`ws message`, event.data)
            let msg = JSON.parse(event.data)
            if (msg.type == 1) {
                clientId = msg.clientId
                console.log(`Hello resp as ${clientId}`)
                connected = true
            }
        }
        ws.onopen = (event) => { 
            console.log(`ws open`)
            const joiningCode = $page.url.searchParams.get('j')
            let helloReq = {
                protocol: 'websocket-room-server:1',
                // server-specific
                roomProtocol: 'cardographer:2',
                roomId: session._id,
                roomCredential: joiningCode, 
                //clientCredential?: string
                clientType: 'live-1',
                //clientId?: string
                clientState: { nickname }
                //readonly?: boolean // default true
            }
            ws.send(JSON.stringify(helloReq))
        }
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

<div class="flex flex-col h-full w-full">
    <div class="w-full py-1 px-2 bg-gray-700 text-2xl text-white flex items-center">
        <div class="flex grow justify-center text-ellipsis">
            {session.name}
        </div>
    </div>

    {#if failed} 
    <div class="mt-1 text-red-950 bg-red-100 rounded p-4 m-4 text-xl">Sorry, you can't join that session ({failed})</div>
 
    {:else if !connected}
    <div class="flex flex-col p-2">
        <div class="flex m-2">
            <input class="flex-grow" type="text" bind:value={nickname} placeholder="Nickname" disabled={connecting}>
        </div>
        <div class="flex m-2 self-center w-full p-2">
            <button class="w-full button self-center" disabled={connecting || nickname==''} on:click={connect}>Join</button>
        </div>
    </div>
    {:else}
    <div class="flex grow">
        {#if tab=='cards'}
            <CardList cards={cards} bind:this={cardList}></CardList>
        {/if}
    </div>
    <div class="w-full pt-1 pb-0 bg-gray-700 flex flex-wrap text-white justify-center text-center">
        <div class="tab" class:tabSelected={tab=='cards'}>
            Cards
        </div>
    </div>
    {/if}

</div>