<script lang="ts">
	import {base} from "$app/paths";
	import {page} from '$app/stores'

	export let data

	let working = false
	let error = ''
	let message = ''

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

	// submit deck edit form
	async function handleSubmit() {
		message = ''
		error = ''
		working = true

		data.analysis.snapshotIds = data.snapshots.filter((s) => s.selected).map<string>((snapshot) => snapshot._id)
		console.log(`submit`, data.analysis)

		const {analysisId} = $page.params;
		const res = await fetch(`${base}/api/user/analyses/${analysisId}`, {
			method: 'PUT',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(data.analysis)
		});
		working = false;
		if (res.ok) {
			message = "Updated";
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}
</script>

<style>
    .border-highlight {
        @apply border-blue-700;
    }
</style>

<form class="w-full flex flex-col text-sm font-medium p-6 gap-4" on:submit|preventDefault={handleSubmit}>
	{#each data.snapshots as snapshot}
		<label class:border-highlight={snapshot.selected} class="listItem items-center">
			<input type="checkbox" class="form-checkbox mr-4" bind:checked="{snapshot.selected}">
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

	{#if error}
		<div class="message-error">{error}</div>
	{/if}
	{#if message}
		<div class="message-success">{message}</div>
	{/if}

	<input class="button" disabled={working} type='submit' value='Save'>
</form>