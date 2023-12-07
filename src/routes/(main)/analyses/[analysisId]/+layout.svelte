<script lang="ts">
	import {base} from "$app/paths"
	import {page} from '$app/stores'
	import AppBar from "$lib/ui/AppBar.svelte";
	import Tab from "$lib/ui/Tab.svelte";

	let {analysisId} = $page.params
</script>

<div class="flex flex-col min-h-screen">
<AppBar back="{base}/analyses" subtitle="Analysis">
	<Tab url="{base}/analyses/{analysisId}">
		Details
	</Tab>
	<Tab url="{base}/analyses/{analysisId}/sessions">
		Sessions
	</Tab>
	<Tab url="{base}/analyses/{analysisId}/export">
		Export
	</Tab>
	<Tab url="{base}/analyses/{analysisId}/graph">
		Graph
	</Tab>
</AppBar>

<slot/>
</div>