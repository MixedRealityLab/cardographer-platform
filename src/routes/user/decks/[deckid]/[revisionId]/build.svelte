<script context="module" lang="ts">
	import type {FileInfo} from '$lib/apitypes.ts';
	import {base} from '$lib/paths';
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
		const res = await fetch(`${base}/api/user/decks/${deckId}/revisions/${revisionId}/files`, {
			headers: {authorization: `Bearer ${token}`}
		});
		//console.log(`files:`,res);
		if (res.ok) {
			return {
				props: {
					files: await res.json() as FileInfo[]
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

	export let files;
	export let error = "";

	onMount(async () => {
		console.log(`base=${base}, base2=${base2}`);
	});

	function open(file: string) {
		const {deckId, revisionId} = $page.params;
		let path = $page.params.file;
		window.open(`${base2}/uploads/${deckId}/${revisionId}/${path.length > 0 ? path + '/' : ''}${file}`, '_blank');
	}

	let showUpload = false;

	function toggleUpload() {
		showUpload = !showUpload;
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
			files = await res.json() as FileInfo[];
			showUpload = false;
		} else {
			console.log(`error refreshing ${res.status}`);
		}
	}

</script>

<AppBar title="Cardographer" backpage="{base}/user/decks/"/>
<DeckTabs page="files" root="{base}/user/decks/{$page.params.deckId}/{$page.params.revisionId}"/>

<div class="p-4">
	<div class="py-2">
		<!-- TODO: stop if revision isLocked -->
		<FileUploadForm on:close={toggleUpload} on:refresh={refresh}/>
	</div>
	{#if error}
		<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
	{/if}

	{#each files as file, fi}
		{#if file.isDirectory}
			<!-- TODO: fix files/ to actual path to handle sub-sub-directories -->
			<a class="font-medium" href="{'files/'+file.name}">
				<div class:bg-gray-100="{!(fi & 1)}">{file.name}{file.isDirectory ? '/' : ''}</div>
			</a>
		{:else}
			<div class:bg-gray-100="{!(fi & 1)}" on:click="{() => open(file.name)}">{file.name}</div>
		{/if}
	{/each}

</div>

