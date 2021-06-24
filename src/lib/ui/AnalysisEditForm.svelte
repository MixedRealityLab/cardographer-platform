<script lang="ts">
import type {Analysis} from '$lib/types.ts';
import { page, session } from '$app/stores';
import { base } from '$lib/paths';

export let analysis : Analysis;
let working = false;
let error = '';
let message = '';
let showform = false;

// submit deck edit form
async function handleSubmit() {
	console.log(`submit`, analysis);
	message = '';
	error = '';
	
	const token = $session.user?.token;
	if (!token) {
		error = "Sorry, you don't seem to be logged in";
		return;
	}
	working = true;

	const {analid} = $page.params;
	const url = `${base}/api/user/analyses/${analid}`;
	const res = await fetch(url, {
		method: 'PUT',
		headers: { authorization: `Bearer ${token}`,
			'content-type': 'application/json' },
		body: JSON.stringify(analysis)
	});
	working = false;
	if (res.ok) {
		message = "Updated";
	} else {
		error = `Sorry, there was a problem (${res.statusText})`;
	}
}

</script>

<form on:submit|preventDefault={handleSubmit}>
<div class="grid grid-cols-1 gap-2 text-sm">
	<label class="block">
		<span class="font-light">Analysis name</span>
		<input class="mt-1 block w-full" required type="text" bind:value="{analysis.name}" />
	</label>
        <label class="block">
                <span class="font-light">Description</span>
                <textarea rows="3" class="mt-1 block w-full" type="text" bind:value="{analysis.description}"></textarea>
        </label>
        <label class="block">
                <span class="font-light">Credits</span>
                <input class="mt-1 block w-full" type="text" bind:value="{analysis.credits}" />
        </label>
	<div class="">
        <label class="inline-flex ml-6 py-1">
                <input type="checkbox" class="form-checkbox" bind:checked="{analysis.isPublic}">
                <span class="ml-2">Public</span>
        </label>
	</div>

{#if error}
<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
{/if}
{#if message}
<div class="mt-1 border-green-500 bg-green-300 rounded-md w-full py-2 px-2">{message}</div>
{/if}


        <input disabled={working} class="rounded-md mt-1 block w-full bg-gray-300 py-2" class:text-gray-400="{working}" type='submit' value='Save'>
</div>

</form>

