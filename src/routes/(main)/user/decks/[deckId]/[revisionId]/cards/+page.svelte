<script lang="ts">

	import {base} from "$app/paths";
	import type {CardDeckRevision} from "$lib/types"
	import {downloadFile} from "$lib/ui/download"
	import ExpandableSection from "$lib/ui/ExpandableSection.svelte"

	import {page} from '$app/stores'
	import UploadButton from "$lib/ui/UploadButton.svelte";

	export let data: CardDeckRevision
	let working = false
	let error = ''
	let message = ''
	let addUnknown = true

	async function uploadCards(event: CustomEvent<FileList>) {
		const files = event.detail
		message = ''
		error = ''

		working = true
		const {deckId, revisionId} = $page.params
		const res = await fetch(`${base}/api/user/decks/${deckId}/${revisionId}/cards`, {
			method: 'PUT',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				addColumns: addUnknown,
				csvFile: await files[0].text()
			})
		})
		working = false
		if (res.ok) {
			message = "Updated"
			data = await res.json()
		} else {
			error = `Sorry, there was a problem (${res.statusText})`
		}
	}

	async function exportCsv() {
		console.log(`export...`);
		message = error = '';
		working = true;
		const {deckId, revisionId} = $page.params;
		const res = await fetch(`${base}/api/user/decks/${deckId}/${revisionId}/cards.csv?allColumns&withRowTypes`);
		working = false;
		if (res.ok) {
			const text = await res.text();
			let filename = (data.slug ? data.slug : `${data.deckName} v${data.revision}`) + '.csv';
			downloadFile(filename, text);
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}
</script>

<div class="p-6 flex flex-col gap-2">
	{#each data.cards as card}
		<ExpandableSection class="py-1">
			<div slot="title">
				<div class="flex items-center">
					<img src="{base}/icons/card.svg" class="w-5 mr-4" alt=""/>
					<span>{card.name}</span>
					<span class="text-gray-400 ml-1.5">v{card.revision}</span>
				</div>
			</div>
			<div>
				<div class="ml-9">
					<div class="flex">
						{#if card.frontUrl}
							<img src={card.frontUrl.startsWith('/') ? base + card.frontUrl : card.frontUrl} class="h-48"
							     alt="Card"/>
						{/if}
						<div>
							{#if card.description}
								<div class="text-sm">{card.description}</div>
							{/if}
							{#if card.content}
								<div>{card.content}</div>
							{/if}
							<div>
								Type: {card.category}
							</div>
						</div>
					</div>
				</div>
			</div>
		</ExpandableSection>
	{:else}
		<div class="self-center">No Cards</div>
	{/each}

	{#if error}
		<div class="message-error">{error}</div>
	{/if}
	{#if message}
		<div class="message-success">{message}</div>
	{/if}
	<div class="flex justify-center">
		<UploadButton class="button m-3" on:upload={uploadCards} types=".csv,text/csv">
			<img alt="" class="w-3.5 mr-1" src="{base}/icons/upload.svg"/>Upload CSV
		</UploadButton>
		{#if data.cards.length > 0}
			<button class="button m-3" on:click={exportCsv}>
				<img src="{base}/icons/download.svg" alt="" class="w-3.5 mr-1"/>Download CSV
			</button>
		{/if}
	</div>
</div>