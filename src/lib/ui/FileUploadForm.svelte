<script lang="ts">
import { createEventDispatcher } from 'svelte';
import { page, session } from '$app/stores';
import type { PostFilesRequest } from '$lib/apitypes.ts';
import type { CardDeckRevision } from '$lib/type.ts';
import { base } from '$lib/paths';

export let revision : CardDeckRevision;

const dispatch = createEventDispatcher();

// dispatch('close', {})
function doClose() {
	dispatch('close', {});
}

let working = false;
let error = '';
let message = '';
let files;

async function toBase64(file) { 
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result.split(',')[1]);
		reader.onerror = error => reject(error);
	});
}
async function handleSubmit() {
	if (files.length==0) {
		console.log(`no file`);
		return;
	}
	//console.log(`submit`, files);
	message = '';
	error = '';

	const token = $session.user?.token;
	if (!token) {
		error = "Sorry, you don't seem to be logged in";
		return;
	}
	working = true;
	const {deckid, revid, file} = $page.params;
	let req: PostFilesRequest = {
		files: []
	}
	for (let fi=0; fi<files.length; fi++) {
		const file = files[fi];
		
		const content = await toBase64(file);
		//console.log(`ready file ${file.name}`, content);
		req.files.push({
			name: file.name,
			content: content
		});
	}
	const url = `${base}/api/user/decks/${deckid}/revisions/${revid}/files${file.length==0 ? '' : '/'+file}`;
	//console.log(`upload to ${url}`);
	const res = await fetch(url, {
		method: 'POST',
		headers: { authorization: `Bearer ${token}`,
			'content-type': 'application/json' },
		body: JSON.stringify(req)
	});
	//console.log(`done`, res);
	working = false;
	if (res.ok) {
		//message = "Uploaded";
		dispatch('refresh',{});
	} else {
		error = `Sorry, there was a problem (${res.statusText})`;
	}
}

</script>

<button class="mx-2 rounded-md py-1 px-2 border boder-grey-300" on:click="{doClose}">Cancel</button>

<form on:submit|preventDefault={handleSubmit}>
<div class="grid grid-cols-1 gap-2">
	<label class="block">
		<span>Select Files to Upload:</span>
                <input class="mt-1 block w-full" required id="file" type="file" bind:files accept="*" multiple/>
        </label>

{#if error}
<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
{/if}
{#if message}
<div class="mt-1 border-green-500 bg-green-300 rounded-md w-full py-2 px-2">{message}</div>
{/if}

	<input disabled={working || revision?.isLocked} class="rounded-md mt-1 block w-full bg-gray-300 py-2" class:text-gray-400="{working || revision?.isLocked}" type='submit' value='Upload'>
</div>

</form>

