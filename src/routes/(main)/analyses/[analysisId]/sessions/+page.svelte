<script lang="ts">
	import {enhance} from "$app/forms";
	import AnalysisHeader from "../AnalysisHeader.svelte";
	import {formatDate} from "$lib/ui/formatutils";

	export let data
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
					<div class="flex-1 flex items-center gap-1">
						<div class="font-semibold">{snapshot.sessionName}</div>
						{#if snapshot.session}
							{#if snapshot.session.isConsentForStats}
								<div class="chip">Stats</div>
							{/if}
							{#if snapshot.session.isConsentForText}
								<div class="chip">Text</div>
							{/if}
						{:else}
							<div class="chip">??</div>
						{/if}
					</div>
					<div class="text-sm font-light text-gray-700">{formatDate(snapshot.created)}</div>
				</div>
				<div class="flex">
					<div class="flex-1 text-sm font-light">{snapshot.sessionDescription}</div>
					{#if snapshot.snapshotDescription}
						<div class="text-sm font-light">{snapshot.snapshotDescription}</div>
					{/if}
				</div>
				{#if !snapshot.isOwnedByUser}
					<div class="flex text-gray-700">Credits: {snapshot.sessionCredits}</div>
				{/if}
			</div>
		</label>
	{/each}

	<input class="button" type='submit' value='Save'>
</form>