<script context="module" lang="ts">
	import {base} from '$app/paths'
	import {authenticateRequest, errorResponse} from "$lib/ui/token"
	import type {Load} from '@sveltejs/kit'

	export const load: Load = async function ({params, fetch, session}) {
		const {deckId, revisionId} = params;
		const res = await fetch(`${base}/api/user/decks/${deckId}/${revisionId}`, authenticateRequest(session))

		if (res.ok) {
			return {
				props: {
					revision: (await res.json())
				}
			};
		}

		return errorResponse(res)
	}
</script>

<script lang="ts">
	import type {CardDeckRevision} from "$lib/types";
	import DeckTabs from "./_DeckTabs.svelte";
	import {session} from "$app/stores";

	export let revision: CardDeckRevision

	let working = false
	let error = ''
	let message = ''

	// submit deck edit form
	async function handleSubmit() {
		console.log(`submit`, revision)
		message = error = ''
		working = true

		const res = await fetch(`${base}/api/user/decks/${revision.deckId}/${revision.revision}`, authenticateRequest($session, {
			method: 'PUT',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(revision)
		}))
		working = false;
		if (res.ok) {
			message = "Updated";
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}
</script>

<DeckTabs revision="{revision}"/>

<form class="p-6 flex flex-col gap-4" on:submit|preventDefault={handleSubmit}>
	<label>
		<span>Title</span>
		<input bind:value="{revision.deckName}" class="block w-full" id="deckName" required type="text"/>
	</label>
	<label>
		<span>Description</span>
		<textarea bind:value="{revision.deckDescription}" class="block w-full" id="deckDescription" rows="3"
		          type="text"></textarea>
	</label>
	<label>
		<span>Credits</span>
		<input bind:value="{revision.deckCredits}" class="block w-full" id="deckCredits" type="text"/>
	</label>
	<label>
		<span>Revision Subtitle</span>
		<input bind:value="{revision.revisionName}" class="block w-full" id="revisionName" type="text"/>
	</label>
	<label>
		<span>Revision Description</span>
		<textarea bind:value="{revision.revisionDescription}" class="block w-full" id="revisionDescription" rows="3"
		          type="text"></textarea>
	</label>
	<label>
		<span>Slug (for filenames and URLs)</span>
		<input bind:value="{revision.slug}" class="block w-full" id="slug" type="text"/>
	</label>
	<div class="flex flex-wrap justify-center gap-4 py-1">
		<label class="flex items-center gap-2">
			<input bind:checked="{revision.isUsable}" class="form-checkbox" type="checkbox">
			<span>Usable</span>
		</label>
		<label class="flex items-center gap-2">
			<input bind:checked="{revision.isPublic}" class="form-checkbox" type="checkbox">
			<span>Public</span>
		</label>
		<label class="flex items-center gap-2">
			<input bind:checked="{revision.isLocked}" class="form-checkbox" type="checkbox">
			<span>Locked</span>
		</label>
		<label class="flex items-center gap-2">
			<input bind:checked="{revision.isTemplate}" class="form-checkbox" type="checkbox">
			<span>Template</span>
		</label>
		{#if revision?.build}
			<label class="flex items-center">
				<input type="checkbox" class="form-checkbox" bind:checked="{revision.build.isDisabled}">
				<span class="ml-2">Disable re-build</span>
			</label>
		{/if}

	</div>

	{#if error}
		<div class="message-error">{error}</div>
	{/if}
	{#if message}
		<div class="message-success">{message}</div>
	{/if}

	<input class="button self-center mt-2" disabled={working} type='submit' value='Save'>
</form>