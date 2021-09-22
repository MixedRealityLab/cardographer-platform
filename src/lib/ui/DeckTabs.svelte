<script type="ts">
	import {base} from "$app/paths";
	import type {CardDeckRevisionSummary} from "$lib/types";
	import AppBar from "$lib/ui/AppBar.svelte";

	export let page: string
	export let revision: CardDeckRevisionSummary
</script>

<style>
    .tab {
        @apply px-4 rounded-t py-1 cursor-pointer transition-colors duration-500;
    }

    .tab:hover {
        @apply bg-gray-500;
    }
</style>

<AppBar back="{base}/user/decks"/>
<div class="w-full pt-2 pb-0 bg-gray-700 text-white flex flex-wrap justify-center text-center">
	<a href="{base}/user/decks/{revision.deckId}/{revision.revision}" class="tab"
	   class:bg-gray-400="{page==='details'}">
		Details
	</a>
	<a href="{base}/user/decks/{revision.deckId}/{revision.revision}/cards" class="tab"
	   class:bg-gray-400="{page==='cards'}">
		Cards
	</a>
	<a href="{base}/user/decks/{revision.deckId}/{revision.revision}/boards" class="tab"
	   class:bg-gray-400="{page==='boards'}">
		Boards
	</a>
	<a href="{base}/user/decks/{revision.deckId}/{revision.revision}/build" class="tab"
	   class:bg-gray-400="{page==='build'}">
		Build
	</a>
</div>
<a class="w-full block bg-gray-100 font-semibold px-4 py-1"
   href="{base}/user/decks/{revision.deckId}/{revision.revision}/revisions">{revision.deckName}
	<span class="text-gray-400">v{revision.revision}
		<span class="font-normal">{revision.revisionName ? ' ' + revision.revisionName : ''}</span>
	</span>
</a>

