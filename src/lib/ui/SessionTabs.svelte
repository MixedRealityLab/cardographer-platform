<script type="ts">
	import {base} from "$app/paths"
	import type {Session} from "$lib/types"
	import AppBar from "$lib/ui/AppBar.svelte";

	export let session: Session
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

<AppBar back="{base}/user/sessions"/>
<div class="w-full pt-2 pb-0 bg-gray-700 text-white flex flex-wrap justify-center text-center">
	<a href="{base}/user/sessions/{session._id}" class="tab" class:bg-gray-400="{page==='details'}">
		Details
	</a>
	<a href="{base}/user/sessions/{session._id}/snapshots" class="tab" class:bg-gray-400="{page==='sessions'}">
		Snapshots
	</a>
	<a href="{base}/user/sessions/{session._id}/decks" class="tab" class:bg-gray-400="{page==='export'}">
		Decks
	</a>
</div>
<div class="w-full block bg-gray-100 font-semibold px-4 py-1">{session.name}</div>
