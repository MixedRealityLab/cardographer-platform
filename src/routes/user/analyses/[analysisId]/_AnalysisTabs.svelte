<script type="ts">
	import {base} from "$app/paths"
	import {page} from "$app/stores";
	import type {Analysis} from "$lib/types"
	import AppBar from "$lib/ui/AppBar.svelte";
	import Tab from "$lib/ui/Tab.svelte";

	export let analysis: Analysis
	let {analysisId} = $page.params
</script>

<AppBar back="{base}/user/analyses">
	<Tab url="{base}/user/analyses/{analysisId}">
		Details
	</Tab>
	<Tab url="{base}/user/analyses/{analysisId}/sessions">
		Snapshots
	</Tab>
	<Tab href="{base}/user/analyses/{analysisId}/export">
		Export
	</Tab>
</AppBar>
<div class="w-full block bg-gray-100 font-semibold px-4 py-1">{analysis.name}</div>
