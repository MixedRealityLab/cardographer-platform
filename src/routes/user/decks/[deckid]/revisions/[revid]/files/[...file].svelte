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

export let files;
export let error = "";

let path = $page.params.file;
let lpath = 'files'; // TODO

onMount(async () => { });

</script>

<AppBar title="Cardographer" backpage="{path=='' ? '.' : '..'}"/>

<div class="px-2 py-2">
  <div>Files /{path}:</div>
{#if error}
<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
{/if}
 
{#each files as file}
{#if file.isDirectory}
  <a class="font-medium" href="{lpath+'/'+file.name}"><div>{file.name}{file.isDirectory ? '/' : ''}</div></a>
{:else}
  <div>{file.name}</div>
{/if}
{/each}

</div>

