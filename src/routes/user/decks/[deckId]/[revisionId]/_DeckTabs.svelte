<script type="ts">
	import {base} from '$app/paths'
	import {page} from '$app/stores'
	import type {CardDeckRevisionSummary} from "$lib/types"
	import AppBar from "$lib/ui/AppBar.svelte"
	import Tab from "$lib/ui/Tab.svelte"

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
	{#if revision.cardCount > 0}
		<Tab url="{base}/user/decks/{deckId}/{revisionId}/build" checkPath={true}>
			Build
		</Tab>
	{/if}
	<div slot="subheader">
		{#if revision}
			<a class="block hover:text-blue-700 transition-colors duration-500 inline-flex items-center gap-2"
			   href="{base}/user/decks/{revision.deckId}/{revision.revision}/revisions"
			   title="Select Revision">{revision.deckName}
				{#if revision.deckName.toLowerCase().indexOf('deck') === -1}
					Deck
				{/if}
				<span class="opacity-50">v{revision.revision}</span>
				{#if revision.revisionName}
					<span class="opacity-50 font-normal">{revision.revisionName}</span>
				{/if}
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-40" viewBox="0 0 20 20"
				     fill="currentColor">
					<path fill-rule="evenodd"
					      d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
					      clip-rule="evenodd"/>
				</svg>
			</a>
		{/if}
	</div>
</AppBar>


