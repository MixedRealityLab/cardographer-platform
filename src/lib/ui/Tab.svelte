<script lang="ts">
	import {page} from '$app/stores'

	export let url = ""
	export let checkPath = false
	$: path = $page.url.pathname
	$: selected = path === url || (checkPath && path.startsWith(url))
</script>

<style>
    .tab {
        @apply px-4 rounded-t py-1 cursor-pointer transition-colors duration-500 text-gray-200;
    }

    .tabSelected {
        @apply bg-gray-300 cursor-default text-gray-900;
    }

    .tab:hover:not(.tabSelected) {
        @apply bg-gray-600;
    }
</style>

<a href={url} class="tab" class:tabSelected={selected}>
	<slot></slot>
</a>