<script lang="ts">
	import {page} from '$app/stores'

	export let url: string
	export let checkPath: boolean = false
</script>

<style>
    .tab {
        @apply px-4 rounded-t py-1 cursor-pointer transition-colors duration-500;
    }

    .tabSelected {
        @apply bg-gray-400 cursor-default;
    }

    .tab:hover:not(.tabSelected) {
        @apply bg-gray-500;
    }
</style>

<a href={url} class="tab" class:tabSelected="{$page.path === url || (checkPath && $page.path.startsWith(url))}">
	<slot></slot>
</a>