<script lang="ts">
	import { base } from '$app/paths';
	import { HELP_URL } from '$lib/constants'
	export let title = 'Cardographer'
	export let subtitle = ''
	export let back: string = null
</script>

<div class="w-full py-1 px-2 bg-gray-700 text-2xl text-white flex items-center">
	<div class="flex-1 flex items-center">
		{#if back}
		<div class="px-2 py-1">
			<a href="{back}" title="Back" aria-label="Back">
				<svg xmlns="http://www.w3.org/2000/svg"
				     class="h-6 w-6 text-gray-200 transition-colors duration-500 hover:text-white" viewBox="0 0 20 20"
				     fill="currentColor">
					<path fill-rule="evenodd"
					      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
					      clip-rule="evenodd"/>
				</svg>
			</a>
		</div>
		{/if}
		<div class="px-2 py-1 font-bold font-title">{title} {subtitle}</div>
	</div>
	<a href="{HELP_URL}" title="Help" target="cardo_help">
		<img src="{base}/icons/help.svg" class="w-6 mr-2" alt=""/>
	</a>
</div>
<div class="w-full pt-2 pb-0 bg-gray-700 flex flex-wrap text-white justify-center text-center">
	<slot/>
</div>