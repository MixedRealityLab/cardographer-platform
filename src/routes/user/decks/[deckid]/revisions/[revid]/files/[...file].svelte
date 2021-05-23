<script context="module" lang="ts">
import type {Load} from '@sveltejs/kit';
import type {FileInfo} from '$lib/apitypes.ts';

export async function load({ page, fetch, session, context }): Load {
	const token = session.user?.token;
	if (!token) {
		console.log(`note, no user token`, session);
		return {
			props: { files: [] } 
		}
	}
	const {deckid, revid, file} = page.params;
	const url = `/api/user/decks/${deckid}/revisions/${revid}/files/${file}`;
	const res = await fetch(url, {
		headers: { authorization: `Bearer ${token}` }
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
import { page, session } from '$app/stores';
import { onMount } from 'svelte';
import FileUploadForm from '$lib/ui/FileUploadForm.svelte';
 
export let files;
export let error = "";

onMount(async () => { });

function open(file:string) {
	const { deckid, revid } = $page.params;
	let path = $page.params.file;
	window.open(`/uploads/${deckid}/${revid}/${path}/${file}`, '_blank');
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
	const {deckid, revid, file} = $page.params;
	const url = `/api/user/decks/${deckid}/revisions/${revid}/files/${file}`;
	const res = await fetch(url, {
		headers: { authorization: `Bearer ${token}` }
	});
        if (res.ok) {
		files = await res.json() as FileInfo[];
		showUpload = false;
        } else {
		console.log(`error refreshing ${res.status}`);
	}
}

</script>

<AppBar title="Cardographer" backpage="."/>

<div class="px-2 py-2">
  <div class="text-lg font-bold">Files {$page.params.file}/:</div>
  <div class="py-2">
{#if !showUpload}
    <button class="mx-2 rounded-md py-1 px-2 border boder-grey-300" on:click="{toggleUpload}">Upload</button>
{:else}
<!-- TODO: stop if revision isLocked -->
<FileUploadForm on:close={toggleUpload} on:refresh={refresh}/>

{/if}
  </div>
{#if error}
<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
{/if}
 
{#each files as file, fi}
{#if file.isDirectory}
  <!-- TODO: fix files/ to actual path to handle sub-sub-directories -->
  <a class="font-medium" href="{'files/'+file.name}"><div class:bg-gray-100="{!(fi & 1)}">{file.name}{file.isDirectory ? '/' : ''}</div></a>
{:else}
  <div class:bg-gray-100="{!(fi & 1)}" on:click="{open(file.name)}">{file.name}</div>
{/if}
{/each}

</div>

