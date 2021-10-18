<script context="module" lang="ts">
	import {loadBase} from '$lib/paths'
	import {Analysis, SessionSnapshotSummary} from "$lib/types"
	import {authenticateRequest, errorResponses} from "$lib/ui/token"
	import type {LoadInput, LoadOutput} from '@sveltejs/kit'

	interface SessionSelection extends SessionSnapshotSummary {
		selected: boolean
	}

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const headers = authenticateRequest(session)
		const {analysisId} = page.params
		const responses = await Promise.all([
			fetch(`${loadBase}/api/user/analyses/${analysisId}`, headers),
			fetch(`${loadBase}/api/user/snapshots`, headers)
		])

		if (responses.every((res) => res.ok)) {
			const analysis = await responses[0].json() as Analysis
			const snapshots = ((await responses[1].json()).values as SessionSelection[]).sort(compareSessions)
			if (snapshots && analysis && analysis.snapshotIds) {
				snapshots.forEach((snapshot) => {
					snapshot.selected = analysis.snapshotIds.some((id) => id == snapshot._id)
				})
			}

			return {
				props: {
					analysis: analysis,
					snapshots: snapshots
				}
			}
		}

		return errorResponses(responses)
	}

	function compareSessions(a: SessionSelection, b: SessionSelection) {
		const aName = `${a.sessionName} ${a.originallyCreated}`
		const bName = `${b.sessionName} ${b.originallyCreated}`
		return String(aName).localeCompare(bName)
	}
</script>

<script lang="ts">
	import {page, session} from '$app/stores'
	import {base} from '$app/paths'
	import type {Analysis} from '$lib/types'
	import AnalysisTabs from "./_AnalysisTabs.svelte"

	export let analysis: Analysis;
	export let snapshots: SessionSelection[] = []
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

		analysis.snapshotIds = snapshots.filter((s) => s.selected).map<string>((snapshot) => snapshot._id)
		console.log(`submit`, analysis)

		const {analysisId} = $page.params;
		const res = await fetch(`${base}/api/user/analyses/${analysisId}`, authenticateRequest($session, {
			method: 'PUT',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(analysis)
		}));
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

<AnalysisTabs analysis="{analysis}"/>

<form class="w-full flex flex-col text-sm font-medium p-6 gap-4" on:submit|preventDefault={handleSubmit}>
	{#each snapshots as snapshot}
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