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
		const {sessid} = page.params;
		const url = `${base}/api/user/sessions/${sessid}.json`;
		const res = await fetch(url, {
			headers: { authorization: `Bearer ${token}` }
		});

		if (res.ok) {
			return {
				props: {
					sess: (await res.json())
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
import type {Session} from '$lib/types.ts';
import { page, session } from '$app/stores';
import SessionEditForm from '$lib/ui/SessionEditForm.svelte';
import { onMount } from 'svelte';

export let sess : Session;
let showform = false;
let showtesting = false;

function toggleShowform() {
	showform = !showform;
}
function toggleShowtesting() {
	showtesting = !showtesting;
}

onMount(() => { console.log(`onMount session`); });
</script>
<AppBar title="Cardographer" backpage="{base}/user/sessions"/>
<!-- <UserTabs/> -->

{#if sess}
<div class="px-2 py-2">
	<div>{sess.name}</div>
</div>
{/if}

<div class="px-2 py-2 border">
 <div class="w-full" on:click="{toggleShowform}">
  <div class="mx-1 px-2 bg-gray-200 float-right border rounded-full justify-center object-center"><span>{#if showform}-{:else}+{/if}</span></div>
  <span>Session</span>
 </div>

<div class:hidden="{!showform}" class="px-2 py-2">

<SessionEditForm sess="{sess}"/>

</div><!-- hideable form -->
</div><!-- deck edit section -->

<!-- showtesting -->
<div class="px-2 py-2 border">
 <div class="w-full" on:click="{toggleShowtesting}">
  <div class="mx-1 px-2 bg-gray-200 float-right border rounded-full justify-center object-center"><span>{#if showtesting}-{:else}+{/if}</span></div>
  <span>Testing</span>
 </div>

<div class:hidden="{!showtesting}" class="px-2 py-2">

 <a class="w-full" href="{base}/api/client/sessions/{$page.params.sessid}/stage/{sess.currentStage}/deckInfo.json" target="_blank">
  <span>Unity deck info file</span>
 </a>

</div>
</div>
