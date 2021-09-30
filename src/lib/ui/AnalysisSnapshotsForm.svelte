<script lang="ts">
	import {page, session} from '$app/stores';
	import {base} from '$lib/paths';
	import type {Analysis, SessionSnapshotSummary} from '$lib/types.ts';
	import {onMount} from 'svelte';

	export let analysis: Analysis;
	export let snapshots: SessionSnapshotSummary[] = []
	let working = false
	let error = ''
	let message = ''

	onMount(() => {
		if (snapshots && analysis && analysis.snapshots) {
			for (let si in snapshots) {
				snapshots[si] = {
					...snapshots[si],
					selected: analysis.snapshots.find((s) => s._id == snapshots[si]._id)
				};
			}
			console.log(`should be ${analysis.snapshots.length} selected`);
		}
	});

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
		console.log(`submit`, analysis);
		message = '';
		error = '';

		const token = $session.user?.token;
		if (!token) {
			error = "Sorry, you don't seem to be logged in";
			return;
		}
		working = true;

		analysis.snapshots = snapshots.filter((s) => s.selected);
		console.log(`${analysis.snapshots.length} snapshots selected`);

		const {analysisId} = $page.params;
		const url = `${base}/api/user/analyses/${analysisId}`;
		const res = await fetch(url, {
			method: 'PUT',
			headers: {
				authorization: `Bearer ${token}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify(analysis)
		});
		working = false;
		if (res.ok) {
			message = "Updated";
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}

</script>

{#if snapshots}
	<form class="w-full flex flex-col text-sm font-medium py-2" on:submit|preventDefault={handleSubmit}>

		{#each snapshots as snapshot}
			<label class="listItem items-center">
				<input type="checkbox" class="form-checkbox mr-4" bind:checked="{snapshot.selected}">
				<div class="flex flex-1 flex-col">
					<div class="flex">
						<div class="flex-1">{snapshot.sessionName}</div>
						<div class="text-sm font-light">{formatDate(snapshot.originallyCreated)}</div>
					</div>

					<div class="text-sm font-light">{snapshot.sessionDescription}</div>
					<div class="text-sm font-light">{snapshot.sessionType}: {snapshot.snapshotDescription}</div>
				</div>
			</label>
		{/each}

		{#if error}
			<div class="message-error">{error}</div>
		{/if}
		{#if message}
			<div class="message-success">{message}</div>
		{/if}

		<input disabled={working} class="button mt-4" type='submit' value='Save'>
	</form>
{/if}
