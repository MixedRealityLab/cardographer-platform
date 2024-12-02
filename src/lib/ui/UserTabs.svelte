<script lang="ts">
	import {base} from '$app/paths'
	import AppBar from "$lib/ui/AppBar.svelte";
	import Tab from "$lib/ui/Tab.svelte";
	import type {User} from "$lib/types";
	export let user: User|null;
</script>

<AppBar>
    {#if user?.isDeckBuilder }
	<Tab url="{base}/decks">
		Decks
	</Tab>
	{/if}
	<Tab url="{base}/sessions">
		Sessions
	</Tab>
	<Tab url="{base}/analyses">
		Analyses
	</Tab>
	<Tab url="{base}/users">
		Users
	</Tab>
</AppBar>

<div class="w-full block bg-gray-300 font-semibold px-5 py-1.5"></div>
