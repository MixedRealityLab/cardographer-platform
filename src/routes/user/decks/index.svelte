<script context="module" lang="ts">
	import type {Load} from '@sveltejs/kit';
	
	export async function load({ page, fetch, session, context }): Load {
		const token = session.user?.token;
		if (!token) {
			console.log(`note, no user token`, session);
			return {
				props: { decks: [] } 
			}
		}
		const url = `/api/user/decks.json`;
		const res = await fetch(url, {
			headers: { authorization: `Bearer ${token}` }
		});

		if (res.ok) {
			return {
				props: {
					decks: (await res.json()).decks
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
  import type {CardDeckSummary} from '$lib/types.ts';

  export let decks : CardDeckSummary[];
</script>

<AppBar title="Cardographer" backpage="/user"/>
<UserTabs page="decks"/>

<div class="px-2">

  <p>{decks.length} decks:</p>
  <div class="w-full grid grid-cols-1 space-x-3 mb-4 text-sm font-medium py-2">
{#each decks as deck}
    <a class="w-full rounded-md py-1 px-2 border boder-grey-300" href="decks/{deck._id}">{deck.name} - {deck.description}</a>
{/each}
  </div>

</div>
