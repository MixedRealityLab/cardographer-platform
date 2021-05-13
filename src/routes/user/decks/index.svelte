<script context="module" lang="ts">
	import type {Load} from '@sveltejs/kit';
	
	export async function load({ page, fetch, session, context }): Load {
		const url = `/api/user/decks.json`;
		const res = await fetch(url);

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
  <div>
{#each decks as deck}
    <div><a href="decks/{deck._id}">{deck.name} - {deck.description}</a></div>
{/each}
  </div>

</div>
