<script lang="ts">
	import {base} from '$app/paths'
	import {page} from "$app/stores";
	import type {CardDeckRevision} from "$lib/types"
	import AppBar from "$lib/ui/AppBar.svelte"
	import Tab from "$lib/ui/Tab.svelte"

	export let data: CardDeckRevision
	let {deckId, revisionId} = $page.params
</script>

<AppBar back="{base}/decks" subtitle="Deck">
	<Tab url="{base}/decks/{deckId}/{revisionId}">
		Details
	</Tab>
	<Tab url="{base}/decks/{deckId}/{revisionId}/cards">
		Cards
	</Tab>
	{#if data.cardCount > 0}
		<Tab url="{base}/decks/{deckId}/{revisionId}/build" checkPath={true}>
			Build
		</Tab>
	{/if}
</AppBar>

<slot/>