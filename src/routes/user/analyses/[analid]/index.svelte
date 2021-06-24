<script context="module" lang="ts">
	import type {Load} from '@sveltejs/kit';
	import { base } from '$lib/paths';
	
	export async function load({ page, fetch, session, context }): Load {
		const token = session.user?.token;
		if (!token) {
			console.log(`note, no user token`, session);
			return {
				props: { revisions: [] } 
			}
		}
		const {analid} = page.params;
		const url = `${base}/api/user/analyses/${analid}.json`;
		const res = await fetch(url, {
			headers: { authorization: `Bearer ${token}` }
		});

		if (res.ok) {
			return {
				props: {
					analysis: (await res.json())
				}
			};
		}

		return {
			status: res.status,
			error: new Error(`Could not load ${url}`)
		};
	}
</script>

<script lang="ts">
import AppBar from '$lib/ui/AppBar.svelte';
import UserTabs from '$lib/ui/UserTabs.svelte';
import type {Analysis} from '$lib/types.ts';
import { page, session } from '$app/stores';
import AnalysisEditForm from '$lib/ui/AnalysisEditForm.svelte';
import { onMount } from 'svelte';

export let analysis : Analysis;
let showform = false;
let showtesting = false;

function toggleShowform() {
	showform = !showform;
}
function toggleShowtesting() {
	showtesting = !showtesting;
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

