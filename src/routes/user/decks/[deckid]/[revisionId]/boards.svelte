<script context="module" lang="ts">
	import {base} from '$lib/paths'
	import type {LoadInput, LoadOutput} from '@sveltejs/kit'

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const token = session.user?.token;
		if (!token) {
			console.log(`note, no user token`, session);
			return {
				props: {revisions: []}
			}
		}
		const {deckId, revisionId} = page.params;
		const res = await fetch(`${base}/api/user/decks/${deckId}/${revisionId}`, {
			headers: {authorization: `Bearer ${token}`}
		});

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
		};
	}
</script>

<script lang="ts">
	import type {CardDeckRevision} from "$lib/types"
	import DeckTabs from "$lib/ui/DeckTabs.svelte"
	import ExpandableSection from "$lib/ui/ExpandableSection.svelte"

	import {page, session} from '$app/stores'
	import type {PutCardsRequest} from '$lib/apitypes.ts'

	export let revision: CardDeckRevision

	let working = false
	let error = ''
	let message = ''
	let files: FileList
	let addUnknown = false
	let fileInput: HTMLInputElement

	// submit form
	async function handleSubmit() {
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
		fileInput.value = '';
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

	async function startUpload(unknownColumns: boolean) {
		addUnknown = unknownColumns
		fileInput.click()
	}
</script>

<DeckTabs page="boards" revision="{revision}"/>

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
			<input name="files" class="mt-1 block w-full hidden" id="file" type="file" bind:files
			       accept=".csv,text/csv"
			       bind:this={fileInput} on:change={handleSubmit}/>
			{#if error}
				<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
			{/if}
			{#if message}
				<div class="mt-1 border-green-500 bg-green-300 rounded-md w-full py-2 px-2">{message}</div>
			{/if}

			<button class="button" on:click={() => startUpload(false)}>
				<img src="{base}/icons/upload.svg" alt="" class="w-3.5 mr-1"/>Upload CSV
			</button>
		</div>
	</div>
</div>