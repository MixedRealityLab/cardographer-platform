<script context="module" lang="ts">
	import type {Load} from '@sveltejs/kit';
	import { base } from '$lib/paths.ts';
	
	export async function load({ page, fetch, session, context }): Load {
		const token = session.user?.token;
		if (!token) {
			console.log(`note, no user token`, session);
			return {
				props: { decks: [] } 
			}
		}
		const url = `${base}/api/user/analyses.json`;
		const res = await fetch(url, {
			headers: { authorization: `Bearer ${token}` }
		});

		if (res.ok) {
			return {
				props: {
					analyses: (await res.json()).values.sort(compareAnalyses)
				}
			};
		}

		return {
			status: res.status,
			error: new Error(`Could not load ${url}`)
		};
	}

function compareAnalyses(a,b) {
	const aname = `${a.name} ${a.owners[0]} ${a.created}`;
	const bname = `${b.name} ${b.owners[0]} ${b.created}`;
	return String(aname).localeCompare(bname);
}

</script>

<script lang="ts">
import AppBar from '$lib/ui/AppBar.svelte';
import UserTabs from '$lib/ui/UserTabs.svelte';
import type {Analysis} from '$lib/types.ts';
import { page, session } from '$app/stores';
import { goto } from '$app/navigation';

export let analyses : Analysis[];
let error = '';
let working = false;

async function newAnalysis() {
	error = '';
	const token = $session.user?.token;
	if (!token) {
		error = "Sorry, you don't seem to be logged in";
		return;
	}	
	working = true;
	const url = `${base}/api/user/analyses`;
	const analysis:Analysis = {
		_id: '',
		name: 'New analysis',
		isPublic: false,
	};
	let res = await fetch(url, {
		method: 'POST',
		headers: { authorization: `Bearer ${token}`,
			'content-type': 'application/json' },
		body: JSON.stringify(analysis)
	});
	working = false;
	if (res.ok) {
		const info = await res.json();
		// redirect
		goto(`analyses/${info.analid}`);
	} else {
		error = `Sorry, there was a problem (${res.statusText})`;
	} 		
}

</script>

<AppBar title="Cardographer" backpage=""/>
<UserTabs page="analyses"/>

<div class="px-2">

  <div class="w-full px-2 py-1"><span class="">{analyses.length} analyses:</span>
  </div>
  <div class="w-full grid grid-cols-1 gap-1 mb-4 text-sm font-medium py-2">
{#each analyses as analysis}
    <a class="w-full rounded-md py-1 px-2 border boder-grey-300" href="analyses/{analysis._id}">
      <div>{analysis.name}</div>
      <div class="flex flex-row gap-1">
	{#if session.isPublic}<div class="px-1 rounded-md bg-gray-200">Public</div>{/if}
      </div>
      <div class="text-sm font-light">{analysis.description}</div>
     </a>
{/each}
  </div>

{#if error}
<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
{/if}

<button disabled={working} class:text-gray-400="{working}" class="rounded-md mt-1 px-2 inline-block bg-gray-300 py-2" on:click="{newAnalysis}">New Analysis</button>

</div>
