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
		const url = `${base}/api/public/templates.json`;
		const res = await fetch(url, {
		});

		if (res.ok) {
			return {
				props: {
					// sort by name
					revisions: (await res.json()).values.sort(compareRevisions)
				}
			};
		}

		return {
			status: res.status,
			error: new Error(`Could not load ${url}`)
		};
	}
	function compareRevisions(a,b) {
		const aname = `${a.deckName} ${('000'+a.revision).slice(-3)} ${a.revisionName}`;
		const bname = `${b.deckName} ${('000'+b.revision).slice(-3)} ${b.revisionName}`;
		return String(aname).localeCompare(bname);
	}
</script>

<script lang="ts">
import AppBar from '$lib/ui/AppBar.svelte';
import UserTabs from '$lib/ui/UserTabs.svelte';
import type {CardDeckRevisionSummary, CardDeckRevision} from '$lib/types.ts';
import type {PostUserDecksResponse} from '$lib/apitypes.ts';
import { page, session } from '$app/stores';
import { goto } from '$app/navigation';

export let revisions : CardDeckRevisionSummary[];
let selected : CardDeckRevision = null;

function selectRevision(revision:CardDeckRevisionSummary) {
	if (working) return;
	selected = revision;
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
	// get full revision
	const geturl = `${base}/api/public/decks/${selected.deckId}/revisions/${selected.revision}.json`;
	const revres = await fetch(geturl);
	if  (!revres.ok) {
		error = `Sorry, there was a problem getting the template (${revres.statusText})`;
		working = false;
		return;
	}
	const template = await revres.json() as CardDeckRevision;
	template.revisionDescription = `Copy of ${template.deckName} revision ${template.revision} (${template.revisionName})`
	template.deckName = 'New deck';
	template.slug = '';

	const posturl = `${base}/api/user/decks`;
	const postres = await fetch(posturl, {
		method: 'POST',
		headers: { authorization: `Bearer ${token}`,
			'content-type': 'application/json' },
		body: JSON.stringify(template)
	});
	working = false;
	if (postres.ok) {
		message = "Created";
		const info = await postres.json() as PostUserDecksResponse;
		// redirect
		goto(`decks/${info.deckid}/revisions/${info.revid}`);
		console.log(`created`, info);
	} else {
		error = `Sorry, there was a problem (${postres.statusText})`;
	}
}
</script>

<AppBar title="Cardographer" backpage=""/>
<UserTabs page="newdeck"/>

<div class="px-2">

  <p class="py-1">Select template:</p>
  <div class="w-full grid grid-cols-1 gap-1 mb-4 text-sm font-medium py-2">
{#each revisions as revision}
<div on:click="{selectRevision(revision)}" class:bg-gray-100="{revision==selected}" class="w-full rounded-md py-1 px-2 border boder-grey-300">
	<div class="flex flex-row gap-1">
		<div>{revision.deckName} ({revision.revisionName ? revision.revisionName : revision.revision})</div>
		{#if !revision.isUsable}<div class="px-1 rounded-md bg-gray-200">Don't use</div>{/if}
		{#if revision.isPublic}<div class="px-1 rounded-md bg-gray-200">Public</div>{/if}
		</div>
	<div class="text-sm font-light">{revision.revisionDescription}</div>
</div>

{#if revision == selected}
<form on:submit|preventDefault={handleSubmit}>
<div class="grid grid-cols-1 gap-2">

{#if error}
<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
{/if}
{#if message}
<div class="mt-1 border-green-500 bg-green-300 rounded-md w-full py-2 px-2">{message}</div>
{/if}

<input disabled={working} class="rounded-md mt-1 block w-full bg-gray-300 py-2" class:text-gray-400="{working}" type='submit' value='Copy as New Deck'>
</div>

</form>
{/if}
{/each}
  </div>

</div>
