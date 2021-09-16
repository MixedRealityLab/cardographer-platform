<script context="module" lang="ts">
	import type {FileInfo} from '$lib/apitypes.ts';
	import {base} from '$lib/paths';
	import type {CardDeckRevisionSummary} from "$lib/types";
	import type {LoadInput, LoadOutput} from '@sveltejs/kit';

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const token = session.user?.token;
		if (!token) {
			console.log(`note, no user token`, session);
			return {
				props: {files: []}
			}
		}
		const {deckId, revisionId} = page.params;
		const authHeaders = {headers: {authorization: `Bearer ${token}`}};
		const responses = await Promise.all([
			fetch(`${base}/api/user/decks/${deckId}/revisions/${revisionId}/files`, authHeaders),
			fetch(`${base}/api/user/decks/${deckId}/revisions/${revisionId}.json`, authHeaders)
		])

		if (responses.every((res) => res.ok)) {
			return {
				props: {
					files: await responses[0].json() as FileInfo[],
					revision: await responses[1].json() as CardDeckRevisionSummary
				}
			}
		}
		return {
			props: {
				files: [],
				error: `Could not load file information`
			}
		}
	}
</script>
<script lang="ts">
	import AppBar from '$lib/ui/AppBar.svelte';
	import {page, session} from '$app/stores';
	import DeckTabs from "$lib/ui/DeckTabs.svelte";
	import {onMount} from 'svelte';
	import FileUploadForm from '$lib/ui/FileUploadForm.svelte';
	// build adapter fails on import base, but not set in browser
	import {base as base2} from '$lib/paths';

	export let files: FileInfo[]
	export let revision: CardDeckRevisionSummary
	export let error = "";

	onMount(async () => {
		console.log(`base=${base}, base2=${base2}`);
	});

	function open(file: string) {
		const {deckId, revisionId} = $page.params;
		let path = $page.params.file;
		window.open(`${base2}/uploads/${deckId}/${revisionId}/${path.length > 0 ? path + '/' : ''}${file}`, '_blank');
	}

	async function refresh() {
		console.log(`refresh...`);
		const token = $session.user?.token;
		if (!token) {
			console.log(`error: you don't seem to be logged in`);
			return;
		}
		const {deckId, revisionId, file} = $page.params;
		const url = `${base2}/api/user/decks/${deckId}/revisions/${revisionId}/files${file.length > 0 ? '/' : ''}${file}`;
		const res = await fetch(url, {
			headers: {authorization: `Bearer ${token}`}
		});
		if (res.ok) {
			files = await res.json() as FileInfo[]
		} else {
			console.log(`error refreshing ${res.status}`);
		}
	}

</script>

<AppBar title="Cardographer" backpage="{base}/user/decks/"/>
<DeckTabs page="files" root="{base}/user/decks/{$page.params.deckId}/{$page.params.revisionId}"/>
<div class="w-full bg-gray-100 font-semibold px-4 py-1">{revision.deckName}
	<span class="text-gray-400">v{revision.revision} {revision.revisionName ? ' ' + revision.revisionName : ''}</span>
</div>

<div class="p-4">
	<div class="py-2">
		<!-- TODO: stop if revision isLocked -->
		<FileUploadForm on:refresh={refresh}/>
	</div>
	{#if error}
		<div class="message-error">{error}</div>
	{/if}

	{#each files as file}
		<!-- TODO: fix files/ to actual path to handle sub-sub-directories -->
		<a class="flex" href="{'files/'+file.name}">
			{#if file.isDirectory}
				<img src="{base}/icons/folder.svg" class="w-5" alt="Directory"/>
			{:else}
				<img src="{base}/icons/file.svg" class="w-5" alt="File"/>
			{/if}
			<div>{file.name}</div>
		</a>
	{/each}
</div>

