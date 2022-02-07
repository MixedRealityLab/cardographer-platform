<script context="module" lang="ts">
	import {base} from '$app/paths'
	import {authenticateRequest, errorResponses} from "$lib/ui/token";
	import type {LoadInput, LoadOutput} from '@sveltejs/kit';

	export async function load({params, fetch, session}: LoadInput): Promise<LoadOutput> {
		const requestInfo = authenticateRequest(session)
		const {sessionId} = params;
		const responses = await Promise.all([
			fetch(`${base}/api/user/sessions/${sessionId}`, requestInfo),
			fetch(`${base}/api/user/users`, requestInfo)
		])
		if (responses.every((res) => res.ok)) {
			const users = await responses[1].json()
			return {
				props: {
					session: await responses[0].json(),
					users: users.values
				}
			}
		}
		return errorResponses(responses)
	}
</script>

<script lang="ts">
	import {page, session as pageSession} from "$app/stores"
	import type {Session} from '$lib/types'
	import SessionTabs from "./_SessionTabs.svelte"
	import {fade} from "svelte/transition";
	import UserSelect from "$lib/ui/UserSelect.svelte"

	export let session: Session
	export let users = []

	let working = false
	let error = ''
	let success = false

	function getUsername(email: string): string {
		console.log(users)
		const user = users.find((user) => user.email === email)
		if (user && user.name) {
			return user.name
		}
		return email
	}

	// submit deck edit form
	async function handleSubmit() {
		console.log(`submit`, session);
		success = false
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
			success = true
			setTimeout(() => {
				success = false
			}, 10000)
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}
</script>

<SessionTabs session="{session}"/>

<form class="p-6 flex flex-col text-sm gap-4" on:submit|preventDefault={handleSubmit}>
	<label>
		<span class="font-light">Session name</span>
		<input bind:value="{session.name}" class="mt-1 block w-full" required type="text"/>
	</label>
	<label>
		<span class="font-light">Description</span>
		<textarea bind:value="{session.description}" class="mt-1 block w-full" rows="3" type="text"></textarea>
	</label>
	<label>
		<span class="font-light">Credits</span>
		<input bind:value="{session.credits}" class="mt-1 block w-full" type="text"/>
	</label>
	<UserSelect bind:owners={session.owners} users={users}/>

	<div class="flex justify-center gap-4">
		<label class="flex items-center">
			<input bind:checked="{session.isPublic}" class="form-checkbox" type="checkbox">
			<span class="ml-2">Public</span>
		</label>
		<label class="flex items-center">
			<input bind:checked="{session.isArchived}" class="form-checkbox" type="checkbox">
			<span class="ml-2">Archived</span>
		</label>
		<label class="flex items-center">
			<input bind:checked="{session.isTemplate}" class="form-checkbox" type="checkbox">
			<span class="ml-2">Template</span>
		</label>

	</div>

	{#if error}
		<div class="message-error">{error}</div>
	{/if}
	<div class="self-center mt-2 flex items-center">
		<svg class="h-6 w-6 mx-4 transition-opacity text-green-700 duration-500" class:opacity-0={!success} fill="currentColor"
		     viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
			<path clip-rule="evenodd"
			      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
			      fill-rule="evenodd"/>
		</svg>

		<input class="button" disabled={working} type='submit' value='Save'>
		<div class="w-14"></div>
	</div>
</form>