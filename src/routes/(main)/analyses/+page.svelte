<script lang="ts">
	import {base} from "$app/paths";
	import UserTabs from '$lib/ui/UserTabs.svelte'
	import type {PageData} from './$types';

	export let data: PageData
	let error = '';
	let working = false;
</script>

<UserTabs user={data.localUser}/>

<div class="flex flex-col p-6 w-full text-sm font-medium gap-4">
	{#each data.analyses as analysis}
		<a class="listItem items-center" href="{base}/analyses/{analysis._id}">
			<div class="flex flex-col">
				<div class="font-semibold">{analysis.name}</div>
				<div class="flex flex-row gap-1">
					{#if analysis.isPublic}
						<div class="chip">Public</div>
					{/if}
				</div>
				<div class="text-sm font-light">{analysis.description}</div>
			</div>
		</a>
	{:else}
		<div class="self-center">No Analyses Found</div>
	{/each}

	{#if error}
		<div class="border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
	{/if}

	{#if data.usageAnalyses >= data.quotaAnalyses}
	<div class="message-error">Sorry, you have reached your Analysis quota ({data.usageAnalyses}/{data.quotaAnalyses}) - 
		please ask an administrator if you need to change this.</div>

	{:else}
	<form method="post" class="self-center">
		<!--suppress HtmlWrongAttributeValue -->
		<button disabled={working} class="button">
			<img src="{base}/icons/add.svg" class="w-4 mr-1" alt=""/>New Analysis
		</button>
	</form>
	{/if}
</div>
