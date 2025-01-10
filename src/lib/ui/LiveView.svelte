<script lang="ts">
	import CardList from "$lib/ui/CardList.svelte";
    import type { Session } from "$lib/types"
	import {onMount} from "svelte"
	import { base } from "$app/paths";
    import { page } from '$app/stores';  

    export let session: Session

    $: cards = session?.decks?.flatMap(deck => deck['cards']) ?? []
    let cardList: CardList

    let clientId: string
    onMount(() => {
        console.log(`base = ${base}`)
        const wsurl = `${$page.url.protocol == 'https' ? 'wss' : 'ws'}://${$page.url.host}/${base}wss`
        console.log(`connect to ${wsurl}...`)
        let ws = new WebSocket(wsurl)
        ws.onerror = (event) => { 
            console.log(`ws error`, event) 
        }
        ws.onclose = (event) => { 
            console.log(`ws close`, event) 
        }
        ws.onmessage = (event) => {
            console.log(`ws message`, event.data)
            let msg = JSON.parse(event.data)
            if (msg.type == 1) {
                clientId = msg.clientId
                console.log(`Hello resp as ${clientId}`)
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
                clientState: { }
                //readonly?: boolean // default true
            }
            ws.send(JSON.stringify(helloReq))
        }
    })

</script>

<div class="flex flex-col h-full w-full">
    
	{#if cards}
		<CardList cards={cards} bind:this={cardList}></CardList>
    {/if}
</div>