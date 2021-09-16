<script context="module" lang="ts">
	import type {Load} from '@sveltejs/kit';
	import { base } from '$lib/paths';
	
	export async function load({ page, fetch, session, context }): Load {
		const token = session.user?.token;
		if (!token) {
			console.log(`note, no user token`, session);
			return {
				props: { analysis: null, snapshots: [] } 
			}
		}
		const {analid} = page.params;
		const url = `${base}/api/user/analyses/${analid}.json`;
		const res = await fetch(url, {
			headers: { authorization: `Bearer ${token}` }
		});
		if (!res.ok) {
			return {
				status: res.status,
				error: new Error(`Could not load ${url}`)
			}
		}
		let analysis = await res.json();
		const url2 = `${base}/api/user/snapshots.json`;
		const res2 = await fetch(url2, {
			headers: { authorization: `Bearer ${token}` }
		});
		if (res2.ok) {
			let svalues = await res2.json();
			return {
				props: {
					analysis: analysis,
					snapshots: svalues.values
				}
			};
		}

		return {
			status: res2.status,
			error: new Error(`Could not load ${url2}`)
		};
	}
</script>

<script lang="ts">
import AppBar from '$lib/ui/AppBar.svelte';
import UserTabs from '$lib/ui/UserTabs.svelte';
import type {Analysis, SessionSnapshot} from '$lib/types.ts';
import { page, session } from '$app/stores';
import AnalysisEditForm from '$lib/ui/AnalysisEditForm.svelte';
import AnalysisSnapshotsForm from '$lib/ui/AnalysisSnapshotsForm.svelte';
import AnalysisExportForm from '$lib/ui/AnalysisExportForm.svelte';
import { onMount } from 'svelte';

export let analysis : Analysis;
export let snapshots : SessionSnapshot[];
let showform = false;
let showtesting = false;
let showsnapshots = false;
let showexport = false;

function toggleShowform() {
	showform = !showform;
}
function toggleShowtesting() {
	showtesting = !showtesting;
}
function toggleShowsnapshots() {
	showsnapshots = !showsnapshots;
}
function toggleShowexport() {
	showexport = !showexport;
}

onMount(() => { console.log(`onMount analysis`); });
</script>
<AppBar title="Cardographer" backpage="{base}/user/analyses"/>
<!-- <UserTabs/> -->

{#if analysis}
<div class="px-2 py-2">
	<div>{analysis.name}</div>
</div>
{/if}

<div class="px-2 py-2 border">
 <div class="w-full" on:click="{toggleShowform}">
  <div class="mx-1 px-2 bg-gray-200 float-right border rounded-full justify-center object-center"><span>{#if showform}-{:else}+{/if}</span></div>
  <span>Analysis</span>
 </div>

<div class:hidden="{!showform}" class="px-2 py-2">

<AnalysisEditForm analysis="{analysis}"/>

</div><!-- hideable form -->
</div><!-- deck edit section -->

<div class="px-2 py-2 border">
 <div class="w-full" on:click="{toggleShowsnapshots}">
  <div class="mx-1 px-2 bg-gray-200 float-right border rounded-full justify-center object-center"><span>{#if showsnapshots}-{:else}+{/if}</span></div>
  <span>Snapshots</span>
 </div>

<div class:hidden="{!showsnapshots}" class="px-2 py-2">

<AnalysisSnapshotsForm analysis="{analysis}" snapshots="{snapshots}"/>

</div><!-- hideable form -->
</div><!-- deck edit section -->

<div class="px-2 py-2 border">
 <div class="w-full" on:click="{toggleShowexport}">
  <div class="mx-1 px-2 bg-gray-200 float-right border rounded-full justify-center object-center"><span>{#if showexport}-{:else}+{/if}</span></div>
  <span>Export</span>
 </div>

<div class:hidden="{!showexport}" class="px-2 py-2">

<AnalysisExportForm analysis="{analysis}"/>

</div><!-- hideable form -->
</div><!-- deck edit section -->

