<script type="ts">
	import {base} from '$app/paths'
	import AppBar from "$lib/ui/AppBar.svelte";
	import Tab from "$lib/ui/Tab.svelte";
</script>

<AppBar>
	<Tab url="{base}/user/decks">
		Decks
	</Tab>
	<Tab url="{base}/user/sessions">
		Sessions
	</Tab>
	<Tab url="{base}/user/analyses">
		Analyses
	</Tab>
</AppBar>