<script context="module" lang="ts">
	import {loadBase} from '$lib/paths'
	import {errorResponse, authenticateRequest} from "$lib/ui/token"
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
		console.log(`submit`, revision);
		message = '';
		error = '';

		const token = $session.user?.token;
		if (!token) {
			error = "Sorry, you don't seem to be logged in";
			return;
		}
		working = true;

		const url = `${base}/api/user/decks/${revision.deckId}/${revision.revision}`;
		const res = await fetch(url, {
			method: 'PUT',
			headers: {
				authorization: `Bearer ${token}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify(revision)
		});
		working = false;
		if (res.ok) {
			message = "Updated";
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}
</script>

<DeckTabs tab="details" revision="{revision}"/>

<form class="p-6 flex flex-col" on:submit|preventDefault={handleSubmit}>
	<label class="">
		<span class="text-sm text-gray-500">Title</span>
		<input class="block w-full" required id="deckName" type="text" bind:value="{revision.deckName}"/>
	</label>
	<label class="mt-2">
		<span class="text-sm text-gray-500">Description</span>
		<textarea rows="3" class="block w-full" id="deckDescription" type="text"
		          bind:value="{revision.deckDescription}"></textarea>
	</label>
	<label class="mt-2">
		<span class="text-sm text-gray-500">Credits</span>
		<input class="block w-full" id="deckCredits" type="text" bind:value="{revision.deckCredits}"/>
	</label>
	<label class="mt-2">
		<span class="text-sm text-gray-500">Revision Subtitle</span>
		<input class="block w-full" id="revisionName" type="text" bind:value="{revision.revisionName}"/>
	</label>
	<label class="mt-2">
		<span class="text-sm text-gray-500">Revision Description</span>
		<textarea rows="3" class="block w-full" id="revisionDescription" type="text"
		          bind:value="{revision.revisionDescription}"></textarea>
	</label>
	<label class="mt-2">
		<span class="text-sm text-gray-500">Slug (for filenames and URLs)</span>
		<input class="block w-full" id="slug" type="text" bind:value="{revision.slug}"/>
	</label>
	<div class="flex flex-wrap justify-center m-3">
		<label class="flex items-center py-1">
			<input type="checkbox" class="form-checkbox" bind:checked="{revision.isUsable}">
			<span class="ml-2">Usable</span>
		</label>
		<label class="flex items-center ml-6 py-1">
			<input type="checkbox" class="form-checkbox" bind:checked="{revision.isPublic}">
			<span class="ml-2">Public</span>
		</label>
		<label class="flex items-center ml-6 py-1">
			<input type="checkbox" class="form-checkbox" bind:checked="{revision.isLocked}">
			<span class="ml-2">Locked</span>
		</label>
		<label class="flex items-center ml-6 py-1">
			<input type="checkbox" class="form-checkbox" bind:checked="{revision.isTemplate}">
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

	<input disabled={working} class="button self-center mt-2" type='submit' value='Save'>
</form>