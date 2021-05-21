<script context="module" lang="ts">
	import type {Load} from '@sveltejs/kit';
	
	export async function load({ page, fetch, session, context }): Load {
		const token = session.user?.token;
		if (!token) {
			console.log(`note, no user token`, session);
			return {
				props: { revisions: [] } 
			}
		}
		const {deckid, revid} = page.params;
		const url = `/api/user/decks/${deckid}/revisions/${revid}.json`;
		const res = await fetch(url, {
			headers: { authorization: `Bearer ${token}` }
		});

		if (res.ok) {
			return {
				props: {
					revision: (await res.json())
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
import type {CardDeckRevision} from '$lib/types.ts';
import { page, session } from '$app/stores';
import RevisionEditForm from '$lib/ui/RevisionEditForm.svelte';
import CardUploadForm from '$lib/ui/CardUploadForm.svelte';
import CardExportForm from '$lib/ui/CardExportForm.svelte';
import RevisionBuildForm from '$lib/ui/RevisionBuildForm.svelte';

export let revision : CardDeckRevision;
let showform = false;
let showcards = false;
let showbuild = false;

function toggleShowform() {
	showform = !showform;
}
function toggleShowcards() {
	showcards = !showcards;
}
function toggleShowbuild() {
	showbuild = !showbuild;
}
</script>

<AppBar title="Cardographer" backpage=".."/>
<!-- <UserTabs/> -->

{#if revision}
<div class="px-2 py-2">
	<div>{revision.deckName} ({revision.revisionName ? revision.revisionName : revision.revision})</div>
</div>
{/if}

<div class="px-2 py-2 border">
 <div class="w-full" on:click="{toggleShowform}">
  <div class="mx-1 px-2 bg-gray-200 float-right border rounded-full justify-center object-center"><span>{#if showform}-{:else}+{/if}</span></div>
  <span>Deck</span>
 </div>

<div class:hidden="{!showform}" class="px-2 py-2">

<RevisionEditForm revision="{revision}"/>

</div><!-- hideable form -->
</div><!-- deck edit section -->

<div class="px-2 py-2 border">
 <div class="w-full" on:click="{toggleShowcards}">
  <div class="mx-1 px-2 bg-gray-200 float-right border rounded-full justify-center object-center"><span>{#if showcards}-{:else}+{/if}</span></div>
  <span>Cards</span>
 </div>

<div class:hidden="{!showcards}" class="px-2 py-2">

<CardUploadForm revision="{revision}"/>

<CardExportForm revision="{revision}"/>

</div><!-- hideable form -->
</div><!-- cards section -->

<div class="px-2 py-2 border">
 <div class="w-full" on:click="{toggleShowbuild}">
  <div class="mx-1 px-2 bg-gray-200 float-right border rounded-full justify-center object-center"><span>{#if showcards}-{:else}+{/if}</span></div>
  <span>Build</span>
 </div>

<div class:hidden="{!showbuild}" class="px-2 py-2">

<RevisionBuildForm revision="{revision}"/>

</div><!-- hideable form -->
</div><!-- cards section -->


