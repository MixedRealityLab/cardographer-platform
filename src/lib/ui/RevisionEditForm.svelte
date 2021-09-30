<script lang="ts">
	import {page, session} from '$app/stores'
	import {base} from '$lib/paths'
	import type {CardDeckRevision} from '$lib/types'

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

		const {deckId, revId} = $page.params;
		const url = `${base}/api/user/decks/${deckId}/revisions/${revId}`;
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

<form on:submit|preventDefault={handleSubmit}>
	<div class="grid grid-cols-1 gap-2 text-sm">
		<label class="block">
			<span class="font-light">Title</span>
			<input class="mt-1 block w-full" required id="deckName" type="text" bind:value="{revision.deckName}"/>
		</label>
		<label class="block">
			<span class="font-light">Description</span>
			<textarea rows="3" class="mt-1 block w-full" id="deckDescription" type="text"
			          bind:value="{revision.deckDescription}"></textarea>
		</label>
		<label class="block">
			<span class="font-light">Credits</span>
			<input class="mt-1 block w-full" id="deckCredits" type="text" bind:value="{revision.deckCredits}"/>
		</label>
		<label class="block">
			<span class="font-light">Revision Subtitle</span>
			<input class="mt-1 block w-full" id="revisionName" type="text" bind:value="{revision.revisionName}"/>
		</label>
		<label class="block">
			<span class="font-light">Revision Description</span>
			<textarea rows="3" class="mt-1 block w-full" id="revisionDescription" type="text"
			          bind:value="{revision.revisionDescription}"></textarea>
		</label>
		<label class="block">
			<span class="font-light">Slug (for filenames and URLs)</span>
			<input class="mt-1 block w-full" id="slug" type="text" bind:value="{revision.slug}"/>
		</label>
		<div class="">
			<label class="inline-flex py-1">
				<input type="checkbox" class="form-checkbox" bind:checked="{revision.isUsable}">
				<span class="ml-2">Usable</span>
			</label>
			<label class="inline-flex ml-6 py-1">
				<input type="checkbox" class="form-checkbox" bind:checked="{revision.isPublic}">
				<span class="ml-2">Public</span>
			</label>
			<label class="inline-flex ml-6 py-1">
				<input type="checkbox" class="form-checkbox" bind:checked="{revision.isLocked}">
				<span class="ml-2">Locked</span>
			</label>
			<label class="inline-flex ml-6 py-1">
				<input type="checkbox" class="form-checkbox" bind:checked="{revision.isTemplate}">
				<span class="ml-2">Template</span>
			</label>
			{#if revision?.build}
				<label class="inline-flex ml-6 py-1">
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


		<input disabled={working} class="button" type='submit' value='Save'>
	</div>

</form>

