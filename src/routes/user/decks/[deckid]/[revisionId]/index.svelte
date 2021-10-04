<script context="module" lang="ts">
	import {loadBase} from '$lib/paths'
	import {authenticateRequest, errorResponse} from "$lib/ui/token"
	import type {LoadInput, LoadOutput} from '@sveltejs/kit'

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const {deckId, revisionId} = page.params;
		const res = await fetch(`${loadBase}/api/user/decks/${deckId}/${revisionId}`, authenticateRequest(session))

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
	import {base} from '$app/paths'
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

<DeckTabs revision="{revision}" tab="details"/>

<form class="p-6 flex flex-col" on:submit|preventDefault={handleSubmit}>
	<label class="">
		<span class="text-sm text-gray-500">Title</span>
		<input bind:value="{revision.deckName}" class="block w-full" id="deckName" required type="text"/>
	</label>
	<label class="mt-2">
		<span class="text-sm text-gray-500">Description</span>
		<textarea bind:value="{revision.deckDescription}" class="block w-full" id="deckDescription" rows="3"
		          type="text"></textarea>
	</label>
	<label class="mt-2">
		<span class="text-sm text-gray-500">Credits</span>
		<input bind:value="{revision.deckCredits}" class="block w-full" id="deckCredits" type="text"/>
	</label>
	<label class="mt-2">
		<span class="text-sm text-gray-500">Revision Subtitle</span>
		<input bind:value="{revision.revisionName}" class="block w-full" id="revisionName" type="text"/>
	</label>
	<label class="mt-2">
		<span class="text-sm text-gray-500">Revision Description</span>
		<textarea bind:value="{revision.revisionDescription}" class="block w-full" id="revisionDescription" rows="3"
		          type="text"></textarea>
	</label>
	<label class="mt-2">
		<span class="text-sm text-gray-500">Slug (for filenames and URLs)</span>
		<input bind:value="{revision.slug}" class="block w-full" id="slug" type="text"/>
	</label>
	<div class="flex flex-wrap justify-center m-3">
		<label class="flex items-center py-1">
			<input bind:checked="{revision.isUsable}" class="form-checkbox" type="checkbox">
			<span class="ml-2">Usable</span>
		</label>
		<label class="flex items-center ml-6 py-1">
			<input bind:checked="{revision.isPublic}" class="form-checkbox" type="checkbox">
			<span class="ml-2">Public</span>
		</label>
		<label class="flex items-center ml-6 py-1">
			<input bind:checked="{revision.isLocked}" class="form-checkbox" type="checkbox">
			<span class="ml-2">Locked</span>
		</label>
		<label class="flex items-center ml-6 py-1">
			<input bind:checked="{revision.isTemplate}" class="form-checkbox" type="checkbox">
			<span class="ml-2">Template</span>
		</label>
		{#if revision?.build}
			<label class="flex items-center ml-6 py-1">
				<input type="checkbox" class="form-checkbox" bind:checked="{revision.build.isDisabled}">
				<span class="ml-2">Disable re-build</span>
			</label>
		{/if}

	</div>

	{#if error}
		<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
	{/if}
	{#if message}
		<div class="mt-1 border-green-500 bg-green-300 rounded-md w-full py-2 px-2">{message}</div>
	{/if}

	<input class="button self-center mt-2" disabled={working} type='submit' value='Save'>
</form>