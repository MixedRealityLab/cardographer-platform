<script lang="ts">
	import {base} from "$app/paths";
	import {formatDate} from "$lib/ui/formatutils"
	import UserTabs from '$lib/ui/UserTabs.svelte'
	import type {PageData} from './$types'

	export let data: PageData

	let showAllDecks = true
</script>

<UserTabs user={data.localUser}/>

<div class="w-full flex flex-col mb-4 text-sm font-medium p-6 gap-4">
	{#each data.decks.filter((deck) => showAllDecks || deck.isOwnedByUser) as deck}
		<a class="listItem" href="{base}/decks/{deck.deckId}/{deck.revision}">
			<img src="{base}/icons/deck.svg" class="w-6 mr-4" alt=""/>
			<div class="flex flex-1 flex-col">
				<div class="flex">
					<div class="flex-1 flex items-center gap-1">
						<span class="font-semibold">{deck.deckName}</span> <span class="text-gray-600">v{deck.revision}</span>
						{#if deck.isPublic}
							<div class="chip">Public</div>
						{/if}
						{#if deck.isTemplate}
							<div class="chip">Template</div>
						{/if}
					</div>
					<div class="text-xs text-gray-600">by {deck.deckCredits}</div>
				</div>
				<div class="flex">
					<div class="flex-1">
						<div class="text-sm font-light">{deck.deckDescription || ''}</div>
						<div class="text-sm font-light">{deck.revisionDescription || ''}</div>
					</div>
					<div class="text-xs font-light text-gray-600">{formatDate(deck.created)}</div>
				</div>
			</div>
		</a>
	{:else}
		<div class="self-center">No Decks Found</div>
	{/each}

	<div class="flex self-center justify-center">
		{#if data.decks.some((deck) => !deck.isOwnedByUser)}
			<label class="flex items-center ml-6 py-1">
				<input type="checkbox" class="hidden" bind:checked="{showAllDecks}">
				{#if showAllDecks}
					<span class="button mx-2">Hide Other's Decks</span>
				{:else}
					<span class="button mx-2">Show All Decks</span>
				{/if}
			</label>
		{/if}
		{#if data.localUser?.isDeckBuilder}
		<a class="button mx-2 self-center" href="{base}/decks/new">
			<img src="{base}/icons/add.svg" class="w-4 mr-1" alt=""/>New Deck
		</a>
		{/if}
	</div>
</div>
