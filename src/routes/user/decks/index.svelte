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
		const url = `${base}/api/user/decks.json`;
		const res = await fetch(url, {
			headers: { authorization: `Bearer ${token}` }
		});

		if (res.ok) {
			return {
				props: {
					decks: (await res.json()).decks.sort(compareDecks)
				}
			};
		}

		return {
			status: res.status,
			error: new Error(`Could not load ${url}`)
		};
	}

function compareDecks(a,b) {
	const aname = `${a.name} ${a._id}`;
	const bname = `${b.name} ${b._id}`;
	return String(aname).localeCompare(bname);
}

</script>

<script lang="ts">
  import AppBar from '$lib/ui/AppBar.svelte';
  import UserTabs from '$lib/ui/UserTabs.svelte';
  import type {CardDeckSummary} from '$lib/types.ts';

  export let decks : CardDeckSummary[];
</script>

<AppBar title="Cardographer" backpage=""/>
<UserTabs page="decks"/>

<div class="px-2">

  <p>{decks.length} decks:</p>
  <div class="w-full grid grid-cols-1 gap-1 mb-4 text-sm font-medium py-2">
{#each decks as deck}
    <a class="w-full rounded-md py-1 px-2 border boder-grey-300" href="decks/{deck._id}">
      <div>{deck.name}</div>
      <div class="text-sm font-light">{deck.description}</div>
     </a>
{/each}
  </div>

</div>
