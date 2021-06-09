<script lang="ts">
import type {Session} from '$lib/types.ts';
import { page, session } from '$app/stores';
import { base } from '$lib/paths';

export let sess : Session;
let working = false;
let error = '';
let message = '';
let showform = false;

// submit deck edit form
async function handleSubmit() {
	console.log(`submit`, sess);
	message = '';
	error = '';
	
	const token = $session.user?.token;
	if (!token) {
		error = "Sorry, you don't seem to be logged in";
		return;
	}
	working = true;

	const {sessid} = $page.params;
	const url = `${base}/api/user/sessions/${sessid}`;
	const res = await fetch(url, {
		method: 'PUT',
		headers: { authorization: `Bearer ${token}`,
			'content-type': 'application/json' },
		body: JSON.stringify(sess)
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
		<span class="font-light">Session name</span>
		<input class="mt-1 block w-full" required type="text" bind:value="{sess.name}" />
	</label>
        <label class="block">
                <span class="font-light">Description</span>
                <textarea rows="3" class="mt-1 block w-full" type="text" bind:value="{sess.description}"></textarea>
        </label>
        <label class="block">
                <span class="font-light">Credits</span>
                <input class="mt-1 block w-full" type="text" bind:value="{sess.credits}" />
        </label>
	<div class="">
        <label class="inline-flex ml-6 py-1">
                <input type="checkbox" class="form-checkbox" bind:checked="{sess.isPublic}">
                <span class="ml-2">Public</span>
        </label>
        <label class="inline-flex ml-6 py-1">
                <input type="checkbox" class="form-checkbox" bind:checked="{sess.isArchived}">
                <span class="ml-2">Archived</span>
        </label>
        <label class="inline-flex ml-6 py-1">
                <input type="checkbox" class="form-checkbox" bind:checked="{sess.isTemplate}">
                <span class="ml-2">Template</span>
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

