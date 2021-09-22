<script lang="ts">
	import {page, session} from '$app/stores';
	import {base} from '$lib/paths';
	import type {Session} from '$lib/types.ts';

	export let sess: Session;
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

		const {sessionId} = $page.params;
		const url = `${base}/api/user/sessions/${sessionId}`;
		const res = await fetch(url, {
			method: 'PUT',
			headers: {
				authorization: `Bearer ${token}`,
				'content-type': 'application/json'
			},
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

<form class="flex flex-col text-sm" on:submit|preventDefault={handleSubmit}>
		<label>
			<span class="font-light">Session name</span>
			<input class="mt-1 block w-full" required type="text" bind:value="{sess.name}"/>
		</label>
		<label class="mt-2">
			<span class="font-light">Description</span>
			<textarea rows="3" class="mt-1 block w-full" type="text" bind:value="{sess.description}"></textarea>
		</label>
		<label class="mt-2">
			<span class="font-light">Credits</span>
			<input class="mt-1 block w-full" type="text" bind:value="{sess.credits}"/>
		</label>
		<div class="flex justify-center mt-4">
			<label class="flex items-center mr-4">
				<input type="checkbox" class="form-checkbox" bind:checked="{sess.isPublic}">
				<span class="ml-2">Public</span>
			</label>
			<label class="flex items-center mr-4">
				<input type="checkbox" class="form-checkbox" bind:checked="{sess.isArchived}">
				<span class="ml-2">Archived</span>
			</label>
			<label class="flex items-center">
				<input type="checkbox" class="form-checkbox" bind:checked="{sess.isTemplate}">
				<span class="ml-2">Template</span>
			</label>

		</div>

		{#if error}
			<div class="message-error">{error}</div>
		{/if}
		{#if message}
			<div class="message-success">{message}</div>
		{/if}

		<input disabled={working} class="button mt-4 self-center" class:text-gray-400="{working}"
		       type='submit' value='Save'>
</form>

