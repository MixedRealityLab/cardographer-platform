<script lang="ts">

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
			<a href="{back}" title="Back">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 hover:opacity-75 transition-opacity duration-500" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd"
					      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
					      clip-rule="evenodd"/>
				</svg>
			</a>
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

