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
		const {deckid} = page.params;
		const url = `/api/user/decks/${deckid}/revisions.json`;
		const res = await fetch(url, {
			headers: { authorization: `Bearer ${token}` }
		});

		if (res.ok) {
			return {
				props: {
					revisions: (await res.json()).revisions
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
  import type {CardDeckRevisionSummary} from '$lib/types.ts';

  export let revisions : CardDeckRevisionSummary[];
</script>

<AppBar title="Cardographer" backpage="."/>
<!-- <UserTabs/> -->

<div class="px-2">

  <p>{revisions.length} revisions:</p>
  <div class="w-full grid grid-cols-1 gap-1 mb-4 text-sm font-medium py-2">
{#each revisions as revision}
    <a class="w-full rounded-md py-1 px-2 border boder-grey-300" href="{revision.deckId}/revisions/{revision.revision}">
      <div class="flex flex-row gap-1">
	<div>{revision.deckName} ({revision.revisionName ? revision.revisionName : revision.revision})</div>
	{#if !revision.isUsable}<div class="px-1 rounded-md bg-gray-200">Don't use</div>{/if}
	{#if revision.isLocked}<div class="px-1 rounded-md bg-gray-200">Locked</div>{/if}
	{#if revision.isPublic}<div class="px-1 rounded-md bg-gray-200">Public</div>{/if}
	{#if revision.isTemplate}<div class="px-1 rounded-md bg-gray-200">Template</div>{/if}
      </div>
      <div class="text-sm font-light">{revision.revisionDescription}</div>
    </a>
{/each}
  </div>

</div>
