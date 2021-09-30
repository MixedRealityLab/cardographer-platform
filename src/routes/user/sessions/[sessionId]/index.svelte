<script context="module" lang="ts">
	import {base} from '$lib/paths';
	import {authenticateRequest, errorResponse} from "$lib/ui/token";
	import type {LoadInput, LoadOutput} from '@sveltejs/kit';

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const {sessionId} = page.params;
		const res = await fetch(`${base}/api/user/sessions/${sessionId}`, authenticateRequest(session));

		if (res.ok) {
			return {
				props: {
					session: await res.json()
				}
			};
		}
		return errorResponse(res)
	}
</script>

<script lang="ts">
	import {page, session as pageSession} from "$app/stores"
	import type {Session} from '$lib/types.ts'
	import SessionTabs from "./_SessionTabs.svelte"

	export let session: Session

	let working = false
	let error = ''
	let message = ''

	// submit deck edit form
	async function handleSubmit() {
		console.log(`submit`, session);
		message = '';
		error = '';

		working = true;
		const {sessionId} = $page.params;
		const res = await fetch(`${base}/api/user/sessions/${sessionId}`, authenticateRequest($pageSession, {
			method: 'PUT',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(session)
		}))
		working = false;
		if (res.ok) {
			message = "Updated";
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}
</script>

<SessionTabs session="{session}"/>

<form class="p-6 flex flex-col text-sm" on:submit|preventDefault={handleSubmit}>
	<label>
		<span class="font-light">Session name</span>
		<input class="mt-1 block w-full" required type="text" bind:value="{session.name}"/>
	</label>
	<label class="mt-2">
		<span class="font-light">Description</span>
		<textarea rows="3" class="mt-1 block w-full" type="text" bind:value="{session.description}"></textarea>
	</label>
	<label class="mt-2">
		<span class="font-light">Credits</span>
		<input class="mt-1 block w-full" type="text" bind:value="{session.credits}"/>
	</label>
	<div class="flex justify-center mt-4">
		<label class="flex items-center mr-4">
			<input type="checkbox" class="form-checkbox" bind:checked="{session.isPublic}">
			<span class="ml-2">Public</span>
		</label>
		<label class="flex items-center mr-4">
			<input type="checkbox" class="form-checkbox" bind:checked="{session.isArchived}">
			<span class="ml-2">Archived</span>
		</label>
		<label class="flex items-center">
			<input type="checkbox" class="form-checkbox" bind:checked="{session.isTemplate}">
			<span class="ml-2">Template</span>
		</label>

	</div>

	{#if error}
		<div class="message-error">{error}</div>
	{/if}
	{#if message}
		<div class="message-success">{message}</div>
	{/if}

	<input disabled={working} class="button mt-4 self-center" type='submit' value='Save'>
</form>