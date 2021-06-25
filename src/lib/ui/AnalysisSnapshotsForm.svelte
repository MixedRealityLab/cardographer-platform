<script lang="ts">
import type {Analysis,SessionSnapshotSummary} from '$lib/types.ts';
import { page, session } from '$app/stores';
import { base } from '$lib/paths';
import { onMount } from 'svelte';

export let analysis : Analysis;
export let snapshots:SessionSnapshotSummary[];
let working = false;
let error = '';
let message = '';
let showform = false;

onMount(()=>{
	if (snapshots && analysis && analysis.snapshots) {
		for (let si in snapshots) {
			snapshots[si] = {...snapshots[si], selected: analysis.snapshots.find((s)=>s._id == snapshots[si]._id)};
		}
		console.log(`should be ${analysis.snapshots.length} selected`);
	}
});

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

	analysis.snapshots = snapshots.filter((s) => s.selected);
	console.log(`${analysis.snapshots.length} snapshots selected`);

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

{#if snapshots}

<form on:submit|preventDefault={handleSubmit}>

<div class="w-full grid grid-cols-1 gap-1 mb-4 text-sm font-medium py-2">
{#each snapshots as snapshot}
  <div class="w-full rounded-md py-1 px-2 border boder-grey-300">
    <div class="float-left pr-2">
      <input type="checkbox" class="form-checkbox" bind:checked="{snapshot.selected}">
    </div>
   
    <div>{snapshot.sessionName}</div>
    <div class="text-sm font-light">{snapshot.sessionDescription}</div>
    <div class="text-sm font-light">{snapshot.sessionType}: {snapshot.snapshotDescription}</div>
    <div class="text-sm font-light">{snapshot.originallyCreated}</div>
  </div>
{/each}
</div>

{#if error}
<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
{/if}
{#if message}
<div class="mt-1 border-green-500 bg-green-300 rounded-md w-full py-2 px-2">{message}</div>
{/if}

        <input disabled={working} class="rounded-md mt-1 block w-full bg-gray-300 py-2" class:text-gray-400="{working}" type='submit' value='Save'>

</form>

{/if}
