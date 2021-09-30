<script context="module" lang="ts">
	import {base} from '$lib/paths';
	import {errorResponse, authenticateRequest} from "$lib/ui/token"
	import type {LoadInput, LoadOutput} from '@sveltejs/kit';

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const {deckId, revisionId} = page.params;
		const res = await fetch(`${base}/api/user/decks/${deckId}/revisions`, authenticateRequest(session))

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
		const token = $session.user?.token;
		if (!token) {
			alert("Sorry, you don't seem to be logged in");
			return;
		}
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
		const res = await fetch(`${base}/api/user/decks/${deckId}/revisions`, {
			method: 'POST',
			headers: {
				authorization: `Bearer ${token}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify(newRevision)
		});
		working = false;
		if (res.ok) {
			selectedRevision.isCurrent = false;
			const output = await res.json() as PostUserRevisionResponse;
			message = 'OK';
			// redirect
			goto(`${base}/user/decks/${deckId}/${output.revId}`);
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}

</script>

<AppBar back="{base}/user/decks/{selectedRevision.deckId}/{selectedRevision.revision}"/>

<div class="w-full flex flex-col mb-4 text-sm font-medium p-6">
	{#each revisions as revision}
		<a class="listItem"
		   href="{base}/user/decks/{revision.deckId}/{revision.revision}">
			<img src="{base}/icons/deck.svg" class="w-6 mr-4"/>
			<div class="flex-col">
				<div class:text-gray-500={revision.revision !== selectedRevision.revision}>{revision.deckName}
					<span class="text-gray-400">v{revision.revision} <span
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


	<button class="button self-center m-2" disabled={working} on:click={createNewRevision}>
		<img src="{base}/icons/add.svg" class="w-4 mr-1" alt=""/>New Revision
	</button>
</div>