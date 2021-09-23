<script type="ts">
	import {base} from "$app/paths";
	import {page} from '$app/stores'
	import type {CardDeckRevisionSummary} from "$lib/types";
	import AppBar from "$lib/ui/AppBar.svelte";
	import Tab from "$lib/ui/Tab.svelte";

	export let revision: CardDeckRevisionSummary
	const {deckId, revisionId} = $page.params
</script>

<AppBar back="{base}/user/decks">
	<Tab url="{base}/user/decks/{deckId}/{revisionId}">
		Details
	</Tab>
	<Tab url="{base}/user/decks/{deckId}/{revisionId}/cards">
		Cards
	</Tab>
	<Tab url="{base}/user/decks/{deckId}/{revisionId}/boards">
		Board
	</Tab>
	<Tab url="{base}/user/decks/{deckId}/{revisionId}/build" checkPath={true}>
		Build
	</Tab>
</AppBar>
{#if revision}
	<a class="w-full block bg-gray-100 font-semibold px-4 py-1"
	   href="{base}/user/decks/{revision.deckId}/{revision.revision}/revisions">{revision.deckName}
		<span class="text-gray-400">v{revision.revision}
			<span class="font-normal">{revision.revisionName ? ' ' + revision.revisionName : ''}</span>
	</span>
	</a>
{/if}

