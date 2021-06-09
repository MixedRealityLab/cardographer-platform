<script context="module" lang="ts">
	import type {Load} from '@sveltejs/kit';
	import { base } from '$lib/paths';
	
	export async function load({ page, fetch, session, context }): Load {
		const token = session.user?.token;
		if (!token) {
			console.log(`note, no user token`, session);
			return {
				props: { decks: [] } 
			}
		}
		const url = `${base}/api/public/sessionTemplates.json`;
		const res = await fetch(url, {
		});

		if (res.ok) {
			return {
				props: {
					// sort by name
					sessions: (await res.json()).values.sort(compareSessions)
				}
			};
		}

		return {
			status: res.status,
			error: new Error(`Could not load ${url}`)
		};
	}
	function compareSessions(a,b) {
		const aname = `${a.name} ${a.owners[0]} ${a.created}`;
		const bname = `${b.name} ${b.owners[0]} ${b.created}`;
		return String(aname).localeCompare(bname);
	}
</script>

<script lang="ts">
import AppBar from '$lib/ui/AppBar.svelte';
import UserTabs from '$lib/ui/UserTabs.svelte';
import type {Session} from '$lib/types.ts';
import type {CopySessionRequest, CopySessionResponse} from '$lib/apitypes.ts';
import { page, session } from '$app/stores';
import { goto } from '$app/navigation';

export let sessions : Session[];
let selected : Session = null;

function selectSession(session:Session) {
	if (working) return;
	selected = session;
	error = message = '';
}

let working = false;
let error = '';
let message = '';

async function handleSubmit() {
	if (!selected) return; 
        error = message = '';
	const token = $session.user?.token;
	if (!token) {
		error = "Sorry, you don't seem to be logged in";
		return;
	}
	working = true;

	const posturl = `${base}/api/user/sessions/copy`;
	const req: CopySessionRequest = {
		sessid: selected._id
	};
	const postres = await fetch(posturl, {
		method: 'POST',
		headers: { authorization: `Bearer ${token}`,
			'content-type': 'application/json' },
		body: JSON.stringify(req)
	});
	working = false;
	if (postres.ok) {
		message = "Created";
		const info = await postres.json() as CopySessionResponse;
		// redirect
		goto(`sessions/${info.sessid}`);
		console.log(`created`, info);
	} else {
		error = `Sorry, there was a problem (${postres.statusText})`;
	}
}
</script>

<AppBar title="Cardographer" backpage=""/>
<UserTabs page="newsession"/>

<div class="px-2">

  <p class="py-1">Select session template:</p>
  <div class="w-full grid grid-cols-1 gap-1 mb-4 text-sm font-medium py-2">
{#each sessions as session}
<div on:click="{selectSession(session)}" class:bg-gray-100="{session==selected}" class="w-full rounded-md py-1 px-2 border boder-grey-300">
	<div class="flex flex-row gap-1">
		<div>{session.name} (by {session.owners[0]})</div>
		<div class="px-1 rounded-md bg-gray-200">{session.sessionType}</div>
		{#if session.isPublic}<div class="px-1 rounded-md bg-gray-200">Public</div>{/if}
		</div>
	<div class="text-sm font-light">{session.description}</div>
</div>

{#if session == selected}
<form on:submit|preventDefault={handleSubmit}>
<div class="grid grid-cols-1 gap-2">

{#if error}
<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
{/if}
{#if message}
<div class="mt-1 border-green-500 bg-green-300 rounded-md w-full py-2 px-2">{message}</div>
{/if}

<input disabled={working} class="rounded-md mt-1 block w-full bg-gray-300 py-2" class:text-gray-400="{working}" type='submit' value='Copy as New Session'>
</div>

</form>
{/if}
{/each}
  </div>

</div>
