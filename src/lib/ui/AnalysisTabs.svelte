<script type="ts">
	import {base} from "$app/paths"
	import type {Analysis} from "$lib/types"
	import AppBar from "$lib/ui/AppBar.svelte";

	export let analysis: Analysis
	export let page: string
</script>

<style>
    .tab {
        @apply px-4 rounded-t py-1 cursor-pointer transition-colors duration-500;
    }

    .tab:hover {
        @apply bg-gray-500;
    }
</style>

<AppBar back="{base}/user/analyses"/>
<div class="w-full pt-2 pb-0 bg-gray-700 text-white flex flex-wrap justify-center text-center">
	<a href="{base}/user/analyses/{analysis._id}" class="tab" class:bg-gray-400="{page==='details'}">
		Details
	</a>
	<a href="{base}/user/analyses/{analysis._id}/sessions" class="tab" class:bg-gray-400="{page==='sessions'}">
		Snapshots
	</a>
	<a href="{base}/user/analyses/{analysis._id}/export" class="tab" class:bg-gray-400="{page==='export'}">
		Export
	</a>
</div>
<div class="w-full block bg-gray-100 font-semibold px-4 py-1">{analysis.name}</div>
