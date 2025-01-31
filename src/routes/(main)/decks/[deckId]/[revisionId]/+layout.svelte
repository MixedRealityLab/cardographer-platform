<script lang="ts">
	import {base} from '$app/paths'
	import {page} from "$app/stores"
	import AppBar from "$lib/ui/AppBar.svelte"
	import Tab from "$lib/ui/Tab.svelte"
	import type {LayoutData} from './$types'

	export let data: LayoutData

	let {deckId, revisionId} = $page.params
</script>

<AppBar back="{base}/decks" subtitle="Deck">
	<Tab url="{base}/decks/{deckId}/{revisionId}">
		Details
	</Tab>
	<Tab url="{base}/decks/{deckId}/{revisionId}/cards">
		Cards
	</Tab>
	{#if data.revision.isOwnedByUser && data.revision.cardCount > 0}
		<Tab url="{base}/decks/{deckId}/{revisionId}/build" checkPath={true}>
			Build
		</Tab>
	{/if}
	{#if data.revision.cardCount > 0}
		<Tab url="{base}/sessions/deck-{deckId}-{revisionId}/cards">
			WebApp
		</Tab>
	{/if}
</AppBar>

<slot/>
