<script lang="ts">
	import {base} from '$app/paths'
	import AppBar from "$lib/ui/AppBar.svelte";
	import Tab from "$lib/ui/Tab.svelte";
</script>

<AppBar>
	<Tab url="{base}/decks">
		Decks
	</Tab>
	<Tab url="{base}/sessions">
		Sessions
	</Tab>
	<Tab url="{base}/analyses">
		Analyses
	</Tab>
</AppBar>

<div class="w-full block bg-gray-300 font-semibold px-5 py-1.5"></div>
