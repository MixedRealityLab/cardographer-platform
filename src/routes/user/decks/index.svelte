<script context="module" lang="ts">
	import {loadBase} from '$lib/paths'
	import {authenticateRequest, errorResponse} from "$lib/ui/token"
	import type {LoadInput, LoadOutput} from '@sveltejs/kit'

	export async function load({fetch, session}: LoadInput): Promise<LoadOutput> {
		const res = await fetch(`${loadBase}/api/user/decks`, authenticateRequest(session));
		if (res.ok) {
			return {
				props: {
					decks: (await res.json()).decks.sort(compareDecks)
				}
			};
		}

		return errorResponse(res)
	}

	function compareDecks(a, b) {
		const aName = `${a.name} ${a._id}`;
		const bName = `${b.name} ${b._id}`;
		return String(aName).localeCompare(bName);
	}

</script>

<script lang="ts">
	import UserTabs from '$lib/ui/UserTabs.svelte';
	import type {CardDeckSummary} from '$lib/types'
	import {base} from '$app/paths'

	export let decks: CardDeckSummary[];
</script>

<UserTabs/>

<div class="w-full flex flex-col mb-4 text-sm font-medium p-6">
	{#each decks as deck}
		<a class="listItem" href="{base}/user/decks/{deck._id}/{deck.currentRevision}">
			<img src="{base}/icons/deck.svg" class="w-6 mr-4" alt=""/>
			<div>
				<div> {deck.name} <span class="text-gray-400">v{deck.currentRevision}</span></div>
				{#if deck.description}
					<div class="text-sm font-light">{deck.description}</div>
				{/if}
			</div>
		</a>
	{:else}
		<div class="self-center">No Decks Found</div>
	{/each}

	<a class="mt-4 button self-center" href="{base}/user/decks/new">
		<img src="{base}/icons/add.svg" class="w-4 mr-1" alt=""/>New Deck
	</a>
</div>
