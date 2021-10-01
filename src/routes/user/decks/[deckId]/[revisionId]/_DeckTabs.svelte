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
			<a class="block" href="{base}/user/decks/{revision.deckId}/{revision.revision}/revisions">{revision.deckName}
				{#if revision.deckName.toLowerCase().indexOf('deck') === -1}
					Deck
				{/if}
				<span class="text-gray-600">v{revision.revision}
					<span class="font-normal">{revision.revisionName ? ' ' + revision.revisionName : ''}</span>
	</span>
			</a>
		{/if}
	</div>
</AppBar>


