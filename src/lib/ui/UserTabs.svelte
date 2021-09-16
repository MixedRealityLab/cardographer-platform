<script type="ts">
	import {base} from '$lib/paths';
	export let page: string;
</script>

<style>
    .tab {
        @apply px-4 rounded-t py-1 cursor-pointer transition-colors duration-500;
    }

    .tab:hover {
	    @apply bg-gray-500;
    }
</style>

<div class="w-full pt-2 pb-0 bg-gray-700 flex flex-wrap text-white justify-center text-center">
	<a href="{base}/user/decks" class="tab" class:bg-gray-400="{page==='decks'}">
		Decks
	</a>
	<a href="{base}/user/sessions" class="tab" class:bg-gray-400="{page==='sessions'}">
		Sessions
	</a>
	<a href="{base}/user/analyses" class="tab" class:bg-gray-400="{page==='analyses'}">
		Analyses
	</a>
</div>
