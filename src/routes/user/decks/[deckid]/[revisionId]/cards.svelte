<script context="module" lang="ts">
	import {base} from '$lib/paths'
	import type {LoadInput, LoadOutput} from '@sveltejs/kit'

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const token = session.user?.token;
		if (!token) {
			console.log(`note, no user token`, session)
			return {
				props: {revisions: []}
			}
		}
		const {deckId, revisionId} = page.params
		const url = `${base}/api/user/decks/${deckId}/${revisionId}`
		const res = await fetch(url, {
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
			error: new Error(`Could not load ${url}`)
		};
	}
</script>

<script lang="ts">
	import type {CardDeckRevision} from "$lib/types"
	import DeckTabs from "$lib/ui/DeckTabs.svelte"
	import ExpandableSection from "$lib/ui/ExpandableSection.svelte"

	import {page, session} from '$app/stores'

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
		message = '';
		error = '';

		const token = $session.user?.token;
		if (!token) {
			error = "Sorry, you don't seem to be logged in";
			return;
		}
		working = true;
		const {deckId, revisionId} = $page.params;
		const url = `${base}/api/user/decks/${deckId}/${revisionId}/cards`;
		const res = await fetch(url, {
			method: 'PUT',
			headers: {
				authorization: `Bearer ${token}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				addColumns: addUnknown,
				csvFile: await files[0].text()
			})
		});
		fileInput.value = '';
		working = false;
		if (res.ok) {
			message = "Updated";
			revision = await res.json()
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}

	async function startUpload() {
		fileInput.click()
	}

	let allColumns = false

	//https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
	function download(filename, text) {
		const element = document.createElement('a');
		element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	}

	async function exportCsv() {
		console.log(`export...`);
		message = error = '';
		const token = $session.user?.token;
		if (!token) {
			error = "Sorry, you don't seem to be logged in";
			return;
		}
		working = true;
		const {deckId, revisionId} = $page.params;
		let url = `${base}/api/user/decks/${deckId}/${revisionId}/cards.csv`;
		let sep = '?';
		if (allColumns) {
			url = url + sep + 'allColumns';
			sep = '&';
			url = url + sep + 'withRowTypes';
		}
		const res = await fetch(url, {
			headers: {authorization: `Bearer ${token}`},
		});
		working = false;
		if (res.ok) {
			const text = await res.text();
			let filename = (revision.slug ? revision.slug : `${revision.deckName} v${revision.revision}`) + '.csv';
			download(filename, text);
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}

	}
</script>

<DeckTabs page="cards" revision="{revision}"/>

<div class="p-4">
	{#each revision.cards as card}
		<ExpandableSection>
			<div slot="title">
				<div class="flex items-center">
					<img src="{base}/icons/card.svg" class="w-5 mr-4"/>
					<span>{card.name}</span>
					<span class="text-gray-400 ml-1.5">v{card.revision}</span>
				</div>
			</div>
			<div>
				<div class="ml-9 mb-4">
					<div>
						Type: {card.category}
					</div>
					{#if card.description}
						<div>{card.description}</div>
					{/if}
					{#if card.content}
						<div>{card.content}</div>
					{/if}
				</div>
			</div>
		</ExpandableSection>
	{/each}

	{#if error}
		<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
	{/if}
	{#if message}
		<div class="mt-1 border-green-500 bg-green-300 rounded-md w-full py-2 px-2">{message}</div>
	{/if}
	<div class="flex justify-center">
		<div class="flex flex-col m-3">
			<input name="files" class="mt-1 block w-full hidden" id="file" type="file" bind:files
			       accept=".csv,text/csv"
			       bind:this={fileInput} on:change={handleSubmit}/>


			<button class="button" on:click={startUpload}>
				<img src="{base}/icons/upload.svg" alt="" class="w-3.5 mr-1"/>Upload CSV
			</button>
			<label class="flex items-center mt-1">
				<input type="checkbox" bind:checked="{addUnknown}">
				<span class="ml-2 text-sm">Additional Columns</span>
			</label>
		</div>

		<div class="flex flex-col m-3">
			<button class="button" on:click={() => exportCsv(false)}>
				<img src="{base}/icons/download.svg" alt="" class="w-3.5 mr-1"/>Download CSV
			</button>

			<label class="flex items-center mt-1">
				<input type="checkbox" bind:checked="{allColumns}">
				<span class="ml-2 text-sm">Additional columns</span>
			</label>
		</div>
	</div>
</div>