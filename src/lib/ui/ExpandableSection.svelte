<script lang="ts">
	import {base} from '$app/paths';
	import {slide} from 'svelte/transition'

	export let expanded = false
</script>

<div class={$$props.class}>
	<button class="w-full flex flex-row cursor-pointer" on:click={() => expanded = !expanded}>
		<div class="flex-1">
			<slot name="title">Title</slot>
		</div>
		{#if expanded}
			<img class="w-6" src={`${base}/icons/chevron_up.svg`} alt="Collapse"/>
		{:else}
			<img class="w-6" src={`${base}/icons/chevron_down.svg`} alt="Expand"/>
		{/if}
	</button>

	{#if expanded}
		<div transition:slide>
			<slot></slot>
		</div>
	{/if}
</div>