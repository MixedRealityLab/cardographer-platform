<script context="module" lang="ts">
	import {base} from '$lib/paths.ts';
	import type {LoadInput, LoadOutput} from '@sveltejs/kit';

	export async function load({fetch, session}: LoadInput): Promise<LoadOutput> {
		const token = session.user?.token;
		if (!token) {
			console.log(`note, no user token`, session);
			return {
				props: {decks: []}
			}
		}
		const url = `${base}/api/user/sessions.json`;
		const res = await fetch(url, {
			headers: {authorization: `Bearer ${token}`}
		});

		if (res.ok) {
			return {
				props: {
					sessions: (await res.json()).values.sort(compareSessions)
				}
			};
		}

		return {
			status: res.status,
			error: new Error(`Could not load ${url}`)
		};
	}

	function compareSessions(a, b) {
		const aname = `${a.name} ${a.owners[0]} ${a.created}`;
		const bname = `${b.name} ${b.owners[0]} ${b.created}`;
		return String(aname).localeCompare(bname);
	}

</script>

<script lang="ts">
	import AppBar from '$lib/ui/AppBar.svelte';
	import UserTabs from '$lib/ui/UserTabs.svelte';
	import type {Session} from '$lib/types.ts';

	export let sessions: Session[];
	let showArchived = false;
</script>

<AppBar title="Cardographer" backpage=""/>
<UserTabs page="sessions"/>

<div class="w-full flex flex-col mb-4 text-sm font-medium p-4">
	<div><span class="">{sessions.length} sessions:</span>
		<label class="inline-flex ml-6 py-1">
			<input type="checkbox" class="py-1 form-checkbox" bind:checked="{showArchived}">
			<span class="ml-2">Archived</span>
		</label>
	</div>
	{#each sessions as session}
		{#if showArchived === session.isArchived}
			<a class="w-full rounded-md py-1 px-2 border border-grey-300" href="sessions/{session._id}">
				<div>{session.name}</div>
				<div class="flex flex-row gap-1">
					{#if session.isPublic}
						<div class="px-1 rounded-md bg-gray-200">Public</div>
					{/if}
					{#if session.isTemplate}
						<div class="px-1 rounded-md bg-gray-200">Template</div>
					{/if}
					{#if session.isArchived}
						<div class="px-1 rounded-md bg-gray-200">Archived</div>
					{/if}
				</div>
				<div class="text-sm font-light">{session.description}</div>
			</a>
		{/if}
	{/each}

	<div class="flex self-center justify-center">
		<a class="button mx-2 self-center" href="{base}/user/sessions/new">
			<img src="{base}/icons/add.svg" class="button-icon" alt=""/>New Session
		</a>
		<a class="button mx-2 self-center" href="{base}/user/sessions/import">
			<img src="{base}/icons/upload.svg" class="button-icon" alt=""/>Upload Sessions
		</a>
	</div>
</div>