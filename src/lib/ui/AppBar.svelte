<script lang="ts">
	import {base} from '$lib/paths'

	export let title: string = 'Cardographer';
	export let back: string = null;
</script>

<style>
	.title {
		@apply px-2 py-1 font-bold;
        font-family: 'Lato', 'Roboto', 'Open Sans', sans-serif;
	}
</style>

<div class="w-full py-1 px-2 bg-gray-700 text-2xl text-white flex items-center">
	{#if back}
		<div class="px-2 py-1">
			<a href="{back}"><img src={`${base}/icons/back.svg`} alt="Back" class="w-6 h-6"/></a>
		</div>
	{/if}
	<div class="title">{title}</div>
</div>
<div class="w-full pt-2 pb-0 bg-gray-700 flex flex-wrap text-white justify-center text-center">
	<slot/>
</div>
<div class="w-full block bg-gray-300 font-semibold px-4 py-1">
	<slot name="subheader"/>
</div>

