<script context="module" lang="ts">
	import {loadBase} from '$lib/paths'
	import {authenticateRequest, errorResponse} from "$lib/ui/token"
	import type {LoadInput, LoadOutput} from '@sveltejs/kit';

	export async function load({params, fetch, session}: LoadInput): Promise<LoadOutput> {
		const {deckId, revisionId} = params;
		const res = await fetch(`${loadBase}/api/user/decks/${deckId}/revisions`, authenticateRequest(session))

		if (res.ok) {
			const revisions = (await res.json()).revisions.sort(compareRevisions)
			const revision = revisions.find((rev) => rev.revision == revisionId)

			return {
				props: {
					revisions: revisions,
					selectedRevision: revision
				}
			};
		}

		return errorResponse(res)
	}

	function compareRevisions(a, b) {
		return b.revision - a.revision;
	}
</script>

<script lang="ts">
	import {base} from '$app/paths'
	import {goto} from "$app/navigation"
	import {page, session} from "$app/stores"
	import {PostUserRevisionResponse} from "$lib/apitypes"
	import {CardDeckRevision} from "$lib/types"
	import AppBar from '$lib/ui/AppBar.svelte'
	import type {CardDeckRevisionSummary} from '$lib/types'

	export let revisions: CardDeckRevisionSummary[]
	export let selectedRevision: CardDeckRevisionSummary

	let working = false;
	let message = '';
	let error = '';

	async function createNewRevision() {
		message = error = '';
		working = true;
		// get latest value
		const getResponse = await fetch(`${base}/api/user/decks/${selectedRevision.deckId}/${selectedRevision.revision}`)
		if (!getResponse.ok) {
			error = `Sorry, couldn't get the latest version of this revision (${getResponse.statusText})`;
			working = false;
			return;
		}
		const newRevision = await getResponse.json() as CardDeckRevision
		const {deckId} = $page.params;
		newRevision.revisionName = 'New revision';
		newRevision.revisionDescription = `Based on revision ${selectedRevision.revision} of ${selectedRevision.deckName}`;
		newRevision.slug = '';
		const res = await fetch(`${base}/api/user/decks/${deckId}/revisions`, authenticateRequest($session, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(newRevision)
		}))
		working = false;
		if (res.ok) {
			selectedRevision.isCurrent = false;
			const output = await res.json() as PostUserRevisionResponse;
			message = 'OK';
			// redirect
			await goto(`${base}/user/decks/${deckId}/${output.revId}`);
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}

	async function deleteDeck() {
		if (confirm("Are you sure you want to delete this deck?")) {
			message = error = '';
			working = true;
			const {deckId} = $page.params;
			const res = await fetch(`${base}/api/user/decks/${deckId}`, authenticateRequest($session, {
				method: 'DELETE'
			}))
			working = false;
			if (res.ok) {
				await goto(`${base}/user/decks`);
			} else {
				error = `Sorry, there was a problem (${res.statusText})`;
			}
		}
	}

</script>

<style>
    .border-highlight {
        @apply border-blue-200 hover:border-blue-400;
    }
</style>

<AppBar back="{base}/user/decks/{selectedRevision.deckId}/{selectedRevision.revision}">
	<div slot="subheader">
		Select Revision
	</div>
</AppBar>

<div class="w-full flex flex-col mb-4 text-sm font-medium p-6 gap-4">
	{#each revisions as revision}
		<a class:border-highlight={revision.revision === selectedRevision.revision} class="listItem items-center"
		   href="{base}/user/decks/{revision.deckId}/{revision.revision}">
			<img src="{base}/icons/deck.svg" class="w-6 mr-4" alt=""/>
			<div class="flex-col">
				<div>{revision.deckName}
					<span class="text-gray-600">v{revision.revision} <span
							class="font-normal">{revision.revisionName ? ' ' + revision.revisionName : ''}</span></span>
				</div>
				<div class="flex flex-row gap-1">
					{#if !revision.isUsable}
						<div class="chip">Don't Use</div>
					{/if}
					{#if revision.isLocked}
						<div class="chip">Locked</div>
					{/if}
					{#if revision.isPublic}
						<div class="chip">Public</div>
					{/if}
					{#if revision.isTemplate}
						<div class="chip">Template</div>
					{/if}
				</div>
				{#if revision.revisionDescription}
					<div class="text-sm font-light">{revision.revisionDescription}</div>
				{/if}
			</div>
		</a>
	{/each}

	<div class="flex justify-center">
		<button class="button-delete button m-2" disabled={working} on:click={deleteDeck}>
			<img alt="" class="w-4 mr-1" src="{base}/icons/delete.svg"/>Delete Deck
		</button>
		<button class="button m-2" disabled={working} on:click={createNewRevision}>
			<img alt="" class="w-4 mr-1" src="{base}/icons/add.svg"/>New Revision
		</button>
	</div>
</div>