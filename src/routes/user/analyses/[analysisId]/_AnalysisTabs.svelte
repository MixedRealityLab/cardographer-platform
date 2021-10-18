<script type="ts">
	import {base} from '$app/paths'
	import {page} from "$app/stores";
	import type {Analysis} from "$lib/types"
	import AppBar from "$lib/ui/AppBar.svelte"
	import Tab from "$lib/ui/Tab.svelte"

	export let analysis: Analysis
	let {analysisId} = $page.params
</script>

<AppBar back="{base}/user/analyses">
	<Tab url="{base}/user/analyses/{analysisId}">
		Details
	</Tab>
	<Tab url="{base}/user/analyses/{analysisId}/sessions">
		Sessions
	</Tab>
	<Tab url="{base}/user/analyses/{analysisId}/export">
		Export
	</Tab>
	<Tab url="{base}/user/analyses/{analysisId}/graph">
		Graph
	</Tab>
	<div slot="subheader" class="flex items-center">
		<div class="flex-1">{analysis.name}</div>
		<slot/>
	</div>
</AppBar>

