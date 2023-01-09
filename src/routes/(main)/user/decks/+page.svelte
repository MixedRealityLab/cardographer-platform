<script lang="ts">
	import {base} from "$app/paths";
	import UserTabs from '$lib/ui/UserTabs.svelte'
	import type {PageData} from './$types'

	export let data: PageData;
</script>

<UserTabs/>

<div class="w-full flex flex-col mb-4 text-sm font-medium p-6 gap-4">
	{#each data.decks as deck}
		<a class="listItem" href="{base}/user/decks/{deck._id}/{deck.currentRevision}">
			<img src="{base}/icons/deck.svg" class="w-6 mr-4" alt=""/>
			<div>
				<div><span class="font-semibold">{deck.name}</span> <span class="text-gray-600">v{deck.currentRevision}</span></div>
				{#if deck.description}
					<div class="text-sm">{deck.description}</div>
				{/if}
			</div>
		</a>
	{:else}
		<div class="self-center">No Decks Found</div>
	{/each}

	<a class="button self-center" href="{base}/user/decks/new">
		<img src="{base}/icons/add.svg" class="w-4 mr-1" alt=""/>New Deck
	</a>
</div>
