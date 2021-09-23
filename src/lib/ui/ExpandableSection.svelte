<script lang="ts">
	import {base} from '$lib/paths'
	import {slide} from 'svelte/transition'

	export let expanded = false
</script>

<div class="w-full px-4 py-2 flex flex-row cursor-pointer" on:click={() => expanded = !expanded}>
	<div class="flex-1">
		<slot name="title">Title</slot>
	</div>
	{#if expanded}
		<img class="w-6" src={`${base}/icons/chevron_up.svg`} alt="Collapse"/>
	{:else}
		<img class="w-6" src={`${base}/icons/chevron_down.svg`} alt="Expand"/>
	{/if}
</div>

{#if expanded}
	<div transition:slide class="px-4">
		<slot></slot>
	</div>
{/if}