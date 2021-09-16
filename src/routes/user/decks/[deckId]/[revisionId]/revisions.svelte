<script context="module" lang="ts">
	import {base} from '$lib/paths';
	import type {LoadInput, LoadOutput} from '@sveltejs/kit';

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const token = session.user?.token;
		if (!token) {
			console.log(`note, no user token`, session);
			return {
				props: {revisions: []}
			}
		}
		const {deckId, revisionId} = page.params;
		const url = `${base}/api/user/decks/${deckId}/revisions`;
		const res = await fetch(url, {
			headers: {authorization: `Bearer ${token}`}
		});

		if (res.ok) {
			const revisions = (await res.json()).revisions.sort(compareRevisions)
			const revision = revisions.find((rev) => rev.revision == revisionId)

			return {
				props: {
					revisions: revisions,
					revision: revision
				}
			};
		}

		return {
			status: res.status,
			error: new Error(`Could not load ${url}`)
		};
	}

	function compareRevisions(a, b) {
		return b.revision - a.revision;
	}
</script>

<script lang="ts">
	import AppBar from '$lib/ui/AppBar.svelte'
	import type {CardDeckRevisionSummary} from '$lib/types'
	import DeckTabs from "$lib/ui/DeckTabs.svelte";

	export let revisions: CardDeckRevisionSummary[]
	export let revision: CardDeckRevisionSummary
</script>

<AppBar title="Cardographer" backpage="{base}/user/decks"/>
<DeckTabs page="revisions" root="{base}/user/decks/{revision.deckId}/{revision.revision}"/>
{#if revision}
	<div class="w-full bg-gray-100 font-semibold px-4 py-1">{revision.deckName}
		<span class="text-gray-400">v{revision.revision} {revision.revisionName ? ' ' + revision.revisionName : ''}</span>
	</div>
{/if}

<div class="w-full flex flex-col mb-4 text-sm font-medium p-4">
	{#each revisions as revision}
		<a class="w-full rounded-md py-2 px-4 border border-grey-300"
		   href="{base}/user/decks/{revision.deckId}/{revision.revision}">
			<div>{revision.deckName}
				<span class="text-gray-400">v{revision.revision} {revision.revisionName ? ' ' + revision.revisionName : ''}</span>
			</div>
			<div class="flex flex-row gap-1">
				{#if !revision.isUsable}
					<div class="px-1 rounded-md bg-gray-200">Don't use</div>
				{/if}
				{#if revision.isLocked}
					<div class="px-1 rounded-md bg-gray-200">Locked</div>
				{/if}
				{#if revision.isPublic}
					<div class="px-1 rounded-md bg-gray-200">Public</div>
				{/if}
				{#if revision.isTemplate}
					<div class="px-1 rounded-md bg-gray-200">Template</div>
				{/if}
			</div>
			{#if revision.revisionDescription}
				<div class="text-sm font-light">{revision.revisionDescription}</div>
			{/if}
		</a>

		{#if revision.isCurrent && revisions.length > 1}
			<p class="pt-4">Old revisions:</p>
		{/if}

	{/each}


	<button class="button self-center m-2" href="{base}/user/sessions/new">
		<img src="{base}/icons/add.svg" class="w-4 mr-1" alt=""/>New Revision
	</button>
</div>