<script>
	import {base} from '$lib/paths'

	export let title;
	export let backpage;
</script>

<div class="w-full py-1 px-2 bg-gray-700 text-2xl text-white flex items-center">
	{#if backpage}
		<div class="px-2 py-1">
			<a href="{backpage}"><img src={`${base}/icons/back.svg`} alt="Back" class="w-6 h-6"/></a>
		</div>
	{/if}
	<div class="px-2 py-1">{title}</div>
</div>
