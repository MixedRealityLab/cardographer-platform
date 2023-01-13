<script lang="ts">
	import {base} from "$app/paths"
	import {page} from '$app/stores'
	import AppBar from "$lib/ui/AppBar.svelte";
	import Tab from "$lib/ui/Tab.svelte";

	let {analysisId} = $page.params
</script>

<div class="flex flex-col min-h-screen">
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
</AppBar>

<slot/>
</div>