<script lang="ts">
	import {enhance} from "$app/forms";
	import AnalysisHeader from "../AnalysisHeader.svelte";

	export let data

	function formatDate(isoDate: string): string {
		const date = new Date(isoDate)
		const now = new Date()
		if (date.getFullYear() == now.getFullYear()) {
			return date.toLocaleTimeString('en-gb', {
				'hour': "numeric",
				'minute': '2-digit'
			}) + ', ' + date.toLocaleDateString('en-gb', {
				month: 'short',
				day: 'numeric'
			})
		} else {
			return date.toLocaleTimeString('en-gb', {
				'hour': "numeric",
				'minute': '2-digit'
			}) + ', ' + date.toLocaleDateString('en-gb', {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			})
		}
	}
</script>

<style>
    .border-highlight {
        @apply border-blue-700;
    }
</style>

<AnalysisHeader analysis={data.analysis}/>

<form class="w-full flex flex-col text-sm font-medium p-6 gap-4" method="post" use:enhance>
	{#each data.snapshots as snapshot}
		<label class:border-highlight={snapshot.selected} class="listItem items-center">
			<input type="checkbox" class="form-checkbox mr-4" bind:checked="{snapshot.selected}" name="sessions"
			       value={snapshot._id}>
			<div class="flex flex-1 flex-col">
				<div class="flex">
					<div class="flex-1 font-semibold">{snapshot.sessionName}</div>
					<div class="text-sm font-light text-gray-700">{formatDate(snapshot.originallyCreated)}</div>
				</div>

				<div class="text-sm font-light">{snapshot.sessionDescription}</div>
				{#if snapshot.snapshotDescription}
					<div class="text-sm font-light">{snapshot.snapshotDescription}</div>
				{/if}
			</div>
		</label>
	{/each}

	<input class="button" type='submit' value='Save'>
</form>