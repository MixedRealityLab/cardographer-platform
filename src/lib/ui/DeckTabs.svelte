<script type="ts">

	export let page: string
	export let root: string
</script>

<style>
    .tab {
        @apply px-4 rounded-t py-1 cursor-pointer transition-colors duration-500;
    }

    .tab:hover {
        @apply bg-gray-500;
    }
</style>

<div class="w-full pt-2 pb-0 bg-gray-700 text-white flex flex-wrap justify-center text-center">
	<a href="{root}" class="tab" class:bg-gray-400="{page==='details'}">
		Details
	</a>
	<a href="{root}/revisions" class="tab" class:bg-gray-400="{page==='revisions'}">
		Revisions
	</a>
	<a href="{root}/cards" class="tab" class:bg-gray-400="{page==='cards'}">
		Cards
	</a>
	<a href="{root}/boards" class="tab" class:bg-gray-400="{page==='boards'}">
		Boards
	</a>
	<a href="{root}/files" class="tab" class:bg-gray-400="{page==='files'}">
		Files
	</a>
	<a href="{root}/build" class="tab" class:bg-gray-400="{page==='build'}">
		Build
	</a>
</div>
