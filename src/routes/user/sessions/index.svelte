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
		const url = `${base}/api/user/sessions.json`;
		const res = await fetch(url, {
			headers: { authorization: `Bearer ${token}` }
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

  export let sessions : Session[];
  let showArchived = false;
</script>

<AppBar title="Cardographer" backpage=""/>
<UserTabs page="sessions"/>

<div class="px-2">

  <div class="w-full px-2 py-1"><span class="">{sessions.length} sessions:</span>
	<label class="inline-flex ml-6 py-1">
		<input type="checkbox" class="py-1 form-checkbox" bind:checked="{showArchived}">
		<span class="ml-2">Archived</span>
	</label>
  </div>
  <div class="w-full grid grid-cols-1 gap-1 mb-4 text-sm font-medium py-2">
{#each sessions as session}
{#if showArchived == session.isArchived}
    <a class="w-full rounded-md py-1 px-2 border boder-grey-300" href="sessions/{session._id}">
      <div>{session.name}</div>
      <div class="flex flex-row gap-1">
	{#if session.isPublic}<div class="px-1 rounded-md bg-gray-200">Public</div>{/if}
	{#if session.isTemplate}<div class="px-1 rounded-md bg-gray-200">Template</div>{/if}
	{#if session.isArchived}<div class="px-1 rounded-md bg-gray-200">Archived</div>{/if}
      </div>
      <div class="text-sm font-light">{session.description}</div>
     </a>
{/if}
{/each}
  </div>

<a class="rounded-md mt-1 px-2 inline-block bg-gray-300 py-2" href="importsessions">Import sessions...</a>

</div>
