<script lang="ts">
	import {base} from "$app/paths"
	import {AnalysisExportTypes} from '$lib/analysistypes'
	import type {Analysis} from "$lib/types"
	import AnalysisHeader from "../AnalysisHeader.svelte";

	export let data: Analysis
	let exportOption = [
		AnalysisExportTypes.CARD_USE,
		AnalysisExportTypes.CARD_ADJACENCY
	];
	let exportType: AnalysisExportTypes = AnalysisExportTypes.CARD_USE;
	let splitByBoard = false;
	let includeDetail = false;
	let boards = '';
	let working = false;
	let error = '';
	let message = '';

	function prettifyEnum(type: AnalysisExportTypes): string {
		if (type == AnalysisExportTypes.CARD_USE) {
			return 'Card Use'
		} else {
			return 'Card Adjacency'
		}
	}
</script>

<AnalysisHeader analysis={data}/>

<div class="p-6">
	<div class="flex flex-col text-sm">
		<label class="flex flex-col">
			<span class="font-light">Export Type</span>
			<select bind:value={exportType} class="mt-1">
				{#each exportOption as option}
					<option value={option}>
						{prettifyEnum(option)}
					</option>
				{/each}
			</select>
		</label>
		<label class="mt-4 flex items-center">
			<input type="checkbox" class="form-checkbox" bind:checked="{splitByBoard}">
			<span class="ml-3">Separate boards</span>
		</label>
		<label class="mt-2 flex items-center">
			<input type="checkbox" class="form-checkbox" bind:checked="{includeDetail}">
			<span class="ml-3">Include details</span>
		</label>
		<label class="mt-2">
			<span class="font-light">Boards to Include</span>
			<input class="mt-1 block w-full" type="text" bind:value="{boards}" placeholder="Include All Boards">
			<span class="font-light text-xs text-gray-700">Comma separated list of board names. Blank to include all boards</span>
		</label>

		{#if error}
			<div class="message-error">{error}</div>
		{/if}
		{#if message}
			<div class="message-success">{message}</div>
		{/if}

		<a class="button self-center mt-4"
		   href="{base}/analyses/{data._id}/analysis.csv?type={exportType}{splitByBoard? '&splitByBoard': ''}{includeDetail ? '&includeDetail': ''}{boards? '&boards=' + encodeURIComponent(boards): ''}">
			Export CSV
		</a>
	</div>
</div>
