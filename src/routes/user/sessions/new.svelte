<script context="module" lang="ts">
	import {base} from '$app/paths'
	import {authenticateRequest, errorResponse} from "$lib/ui/token";
	import type {LoadInput, LoadOutput} from '@sveltejs/kit';

	export async function load({fetch, session}: LoadInput): Promise<LoadOutput> {
		const res = await fetch(`${base}/api/user/sessions/templates`, authenticateRequest(session))
		if (res.ok) {
			return {
				props: {
					sessions: (await res.json()).values.sort(compareSessions)
				}
			}
		}

		return errorResponse(res)
	}

	function compareSessions(a, b) {
		const aName = `${a.name} ${a.owners[0]} ${a.created}`;
		const bName = `${b.name} ${b.owners[0]} ${b.created}`;
		return String(aName).localeCompare(bName);
	}
</script>

<script lang="ts">
	import AppBar from '$lib/ui/AppBar.svelte';
	import type {Session} from '$lib/types';
	import type {CopySessionResponse} from '$lib/apitypes';
	import {session} from '$app/stores';
	import {goto} from '$app/navigation';

	export let sessions: Session[]

	let working = false;
	let error = ''

	async function createSession(sessionId: string) {
		error = ''
		working = true;

		const res = await fetch(`${base}/api/user/sessions/copy`, authenticateRequest($session, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				sessionId: sessionId
			})
		}));
		working = false;
		if (res.ok) {
			const info = await res.json() as CopySessionResponse;
			await goto(`${base}/user/sessions/${info.sessionId}`);
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}
</script>

<AppBar back="{base}/user/sessions">
	<div slot="subheader">Create Session</div>
</AppBar>

<div class="w-full flex flex-col text-sm font-medium p-6">
	{#if error}
		<div class="message-error">{error}</div>
	{/if}
	<div class="listItem flex-col" class:cursor-pointer={!working} on:click={() => createSession('blank')}>
		<div class="flex flex-row gap-1">
			<div>Create Blank Session</div>
		</div>
	</div>

	{#each sessions as session}
		<div on:click={() => createSession(session._id)}
		     class="listItem flex-col" class:cursor-pointer={!working}>
			<div class="flex flex-row gap-2">
				<div>Create Copy of Session {session.name}</div>
				<div class="chip">{session.sessionType}</div>
				{#if session.isPublic}
					<div class="chip">Public</div>
				{/if}
			</div>
			<div class="text-gray-700">{session.owners[0]}</div>
			<div class="text-sm font-light">{session.description}</div>
		</div>
	{/each}
</div>