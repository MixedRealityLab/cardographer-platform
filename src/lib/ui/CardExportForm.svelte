<script lang="ts">
	import {page, session} from '$app/stores';
	import {base} from '$lib/paths';
	import type {CardDeckRevision} from '$lib/types.ts';

	export let revision: CardDeckRevision;
	let allColumns = false
	let working = false;
	let error = '';
	let message = '';

	//https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
	function download(filename, text) {
		var element = document.createElement('a');
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
		const {deckId, revId} = $page.params;
		let url = `${base}/api/user/decks/${deckId}/revisions/${revId}/cards.csv`;
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
			let filename = (revision.slug ? revision.slug : `${revision.deckName}_${revision.revision}`) + '.csv';
			download(filename, text);
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}

	}

</script>

<div class="flex flex-col m-3">
	{#if error}
		<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
	{/if}
	{#if message}
		<div class="mt-1 border-green-500 bg-green-300 rounded-md w-full py-2 px-2">{message}</div>
	{/if}

	<button class="button" on:click={() => exportCsv(false)}>
		<img src="{base}/icons/download.svg" alt="" class="w-3.5 mr-1"/>Download CSV
	</button>

	<label class="flex items-center mt-1">
		<input type="checkbox" bind:checked="{allColumns}">
		<span class="ml-2 text-sm">Additional columns</span>
	</label>
</div>