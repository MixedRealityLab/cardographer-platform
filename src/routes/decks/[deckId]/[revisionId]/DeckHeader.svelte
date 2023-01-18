<script lang="ts">
	import {base} from '$app/paths'
	import {page} from "$app/stores";
	import type {CardDeckRevision} from "$lib/types"

	export let deck: CardDeckRevision
	let {deckId, revisionId} = $page.params
</script>

<div class="subheader">
	<div class="flex items-center">
		<div class="flex-1">
			{#if deck}
				<a class="block hover:text-blue-700 transition-colors duration-500 inline-flex items-center gap-2"
				   href="{base}/decks/{deck.deckId}/{deck.revision}/revisions"
				   title="Select Revision">{deck.deckName}
					{#if deck.deckName.toLowerCase().indexOf('deck') === -1}
						Deck
					{/if}
					<span class="opacity-50">v{deck.revision}</span>
					{#if deck.revisionName}
						<span class="opacity-50 font-normal">{deck.revisionName}</span>
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
		<slot/>
	</div>
</div>
