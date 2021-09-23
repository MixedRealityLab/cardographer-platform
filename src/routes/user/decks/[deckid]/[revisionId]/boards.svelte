<script context="module" lang="ts">
	import {base} from '$lib/paths'
	import {getAuthHeader} from "$lib/ui/token"
	import type {LoadInput, LoadOutput} from '@sveltejs/kit'

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const {deckId, revisionId} = page.params;
		const res = await fetch(`${base}/api/user/decks/${deckId}/${revisionId}`, getAuthHeader(session));

		if (res.ok) {
			return {
				props: {
					revision: (await res.json())
				}
			};
		}

		return {
			status: res.status,
			error: new Error(`Could not load ${res.url}`)
		}
	}
</script>

<script lang="ts">
	import type {CardDeckRevision} from "$lib/types"
	import UploadButton from "$lib/ui/UploadButton.svelte";
	import DeckTabs from "./_DeckTabs.svelte"
	import ExpandableSection from "$lib/ui/ExpandableSection.svelte"

	import {page, session} from '$app/stores'
	import type {PutCardsRequest} from '$lib/apitypes.ts'

	export let revision: CardDeckRevision

	let working = false
	let error = ''
	let message = ''
	let addUnknown = false

	// submit form
	async function upload(event: CustomEvent<FileList>) {
		const files = event.detail
		if (files.length == 0) {
			console.log(`no file`);
			return;
		}
		console.log(`submit`, files);
		message = '';
		error = '';

		const token = $session.user?.token;
		if (!token) {
			error = "Sorry, you don't seem to be logged in";
			return;
		}
		working = true;
		const {deckId, revisionId} = $page.params;
		const csvdata = await files[0].text();
		// defaults to UTF8
		const req: PutCardsRequest = {
			addColumns: addUnknown,
			csvFile: csvdata
		}
		// reset
		const url = `${base}/api/user/decks/${deckId}/${revisionId}/boards`;
		const res = await fetch(url, {
			method: 'PUT',
			headers: {
				authorization: `Bearer ${token}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify(req)
		});
		working = false;
		if (res.ok) {
			message = "Updated";
			//??revision = await res.body.json() as CardDeckRevision;
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}
</script>

<DeckTabs revision="{revision}"/>

<div class="p-4">
	{#each revision.boards as board}
		<ExpandableSection>
			<div slot="title">
				{board.name}
			</div>
			<div>
				{#if board.description}
					<div>{board.description}</div>
				{/if}
				{#each board.regions as region}
					<div>{region.name}</div>
				{/each}
			</div>

		</ExpandableSection>
	{/each}

	<div class="flex justify-center">
		<div class="flex flex-col m-3">
			{#if error}
				<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
			{/if}
			{#if message}
				<div class="mt-1 border-green-500 bg-green-300 rounded-md w-full py-2 px-2">{message}</div>
			{/if}

			<UploadButton class="button" on:upload={upload} types=".csv,text/csv">
				<img src="{base}/icons/upload.svg" alt="" class="w-3.5 mr-1"/>Upload CSV
			</UploadButton>
		</div>
	</div>
</div>