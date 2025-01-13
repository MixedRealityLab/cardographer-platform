<script lang="ts">
	import CardList from "$lib/ui/CardList.svelte";
	import LiveViewHeader from "$lib/ui/LiveViewHeader.svelte";
    import type { Session } from "$lib/types"
	import {onDestroy, onMount} from "svelte"
	import { base } from "$app/paths";
    import { page } from '$app/stores';  
    import { LiveClient } from "$lib/liveclient";
    import { MESSAGE_TYPE, type HelloSuccessResp, type ChangeNotif } from "$lib/liveclienttypes";

    export let session: Session
    export let isOwner: boolean = false

    let connecting = false
    let failed: string|null = null
    let connected = false
    let nickname = ''
    let tab='cards'

    $: cards = session?.decks?.flatMap(deck => deck['cards']) ?? []
    let cardList: CardList

    let clientId: string
    let client : LiveClient = new LiveClient()
    let clients = []
    let seats: string[] = []
    let ws
    let players = {} // players[seat] = clientId
    function connect() {
        const wsurl = `${$page.url.protocol == 'https' ? 'wss' : 'ws'}://${$page.url.host}/${base}wss`
        console.log(`connect to ${wsurl}...`)
        connecting = true
        ws = new WebSocket(wsurl)
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
            if (msg.type == MESSAGE_TYPE.HELLO_SUCCESS_RESP) {
                clientId = msg.clientId
                console.log(`Hello resp as ${clientId}`)
                connected = true
                client.handleHello(msg as HelloSuccessResp)
            } else if (msg.type == MESSAGE_TYPE.CHANGE_NOTIF) {
                console.log(`Change notif`)
                client.handleNotif(msg as ChangeNotif)
            }
            clients = client.getClients()
            seats = client.seats
            console.log(`clients:`, client.getClients())
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
    onDestroy(() => {
        if(ws) {
            console.log(`close websocket on destroy`)
            ws.close()
            ws = null
        }
    })

    function changeSeat(seat) {
        console.log(`change seat ${seat} -> ${players[seat]}`)
        for (const s in players) {
            if (s!==seat && players[s] == players[seat]) {
                // can't do 2 at once
                players[s] = ''
            }
        }
        if (connected) {
            ws.send(JSON.stringify({
                type: MESSAGE_TYPE.CHANGE_REQ,
                roomChanges: [
                    {key:'players', value: JSON.stringify(players)}]
            }))
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
