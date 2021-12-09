<script context="module" lang="ts">
	import {loadBase} from '$lib/paths'
	import {authenticateRequest, errorResponse} from "$lib/ui/token"
	import type {LoadInput, LoadOutput} from '@sveltejs/kit'

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const {deckId, revisionId} = page.params
		const res = await fetch(`${loadBase}/api/user/decks/${deckId}/${revisionId}`, authenticateRequest(session));

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
	import type {CardDeckRevision} from "$lib/types"
	import {downloadFile} from "$lib/ui/download";
	import DeckTabs from "./_DeckTabs.svelte"
	import ExpandableSection from "$lib/ui/ExpandableSection.svelte"

	import {page, session} from '$app/stores'
	import UploadButton from "$lib/ui/UploadButton.svelte";

	export let revision: CardDeckRevision
	let working = false
	let error = ''
	let message = ''
	let addUnknown = true

	async function uploadCards(event: CustomEvent<FileList>) {
		const files = event.detail
		message = ''
		error = ''

		const token = $session.user?.token
		if (!token) {
			error = "Sorry, you don't seem to be logged in"
			return;
		}
		working = true
		const {deckId, revisionId} = $page.params
		const res = await fetch(`${base}/api/user/decks/${deckId}/${revisionId}/cards`, {
			method: 'PUT',
			headers: {
				authorization: `Bearer ${token}`,
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
			revision = await res.json()
		} else {
			error = `Sorry, there was a problem (${res.statusText})`
		}
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
		const res = await fetch(`${base}/api/user/decks/${deckId}/${revisionId}/cards.csv?allColumns&withRowTypes`, {
			headers: {authorization: `Bearer ${token}`},
		});
		working = false;
		if (res.ok) {
			const text = await res.text();
			let filename = (revision.slug ? revision.slug : `${revision.deckName} v${revision.revision}`) + '.csv';
			downloadFile(filename, text);
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}
</script>

<DeckTabs revision="{revision}"/>

<div class="p-6 flex flex-col gap-2">
	{#each revision.cards as card}
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
							<img src={card.frontUrl} class="h-48" alt="Card"/>
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
		{#if revision.cards.length > 0}
			<button class="button m-3" on:click={() => exportCsv(false)}>
				<img src="{base}/icons/download.svg" alt="" class="w-3.5 mr-1"/>Download CSV
			</button>
		{/if}
	</div>
</div>