<script context="module" lang="ts">
	import {base} from '$lib/paths'
	import type {LoadOutput} from '@sveltejs/kit'

	export async function load({fetch, session}): Promise<LoadOutput> {
		const token = session.user?.token;
		if (!token) {
			console.log(`note, no user token`, session);
			return {
				props: {decks: []}
			}
		}
		const url = `${base}/api/user/decks`;
		const res = await fetch(url, {
			headers: {authorization: `Bearer ${token}`}
		});

		if (res.ok) {
			return {
				props: {
					decks: (await res.json()).decks.sort(compareDecks)
				}
			};
		}

		return {
			status: res.status,
			error: new Error(`Could not load ${url}`)
		};
	}

	function compareDecks(a, b) {
		const aName = `${a.name} ${a._id}`;
		const bName = `${b.name} ${b._id}`;
		return String(aName).localeCompare(bName);
	}

</script>

<script lang="ts">
	import UserTabs from '$lib/ui/UserTabs.svelte';
	import type {CardDeckSummary} from '$lib/types.ts';

	export let decks: CardDeckSummary[];
</script>

<UserTabs page="decks"/>

<div class="w-full flex flex-col mb-4 text-sm font-medium p-4">
	{#if decks.length === 0}
		<p>No Decks Found</p>
	{:else}
		{#each decks as deck}
			<a class="listItem"
			   href="{base}/user/decks/{deck._id}/{deck.currentRevision}">
				<img src="{base}/icons/deck.svg" class="w-6 mr-4"/>
				<div>
					<div> {deck.name} <span class="text-gray-400">v{deck.currentRevision}</span></div>
					{#if deck.description}
						<div class="text-sm font-light">{deck.description}</div>
					{/if}
				</div>
			</a>
		{/each}
	{/if}

	<a class="mt-4 button self-center" href="{base}/user/decks/new">
		<img src="{base}/icons/add.svg" class="w-4 mr-1" alt=""/>New Deck
	</a>
</div>
