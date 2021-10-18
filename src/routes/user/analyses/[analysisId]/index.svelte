<script context="module" lang="ts">
	import {loadBase} from '$lib/paths'
	import type {Analysis} from "$lib/types";
	import {authenticateRequest, errorResponse} from "$lib/ui/token";
	import type {LoadInput, LoadOutput} from '@sveltejs/kit';

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const {analysisId} = page.params;
		const res = await fetch(`${loadBase}/api/user/analyses/${analysisId}`, authenticateRequest(session));
		if (res.ok) {
			return {
				props: {
					analysis: await res.json() as Analysis
				}
			}
		}

		return errorResponse(res)
	}
</script>

<script lang="ts">
	import {base} from '$app/paths'
	import {page, session} from '$app/stores'
	import type {Analysis} from '$lib/types'
	import AnalysisTabs from "./_AnalysisTabs.svelte"

	export let analysis: Analysis
	let working = false
	let error = ''
	let message = ''

	// submit deck edit form
	async function handleSubmit() {
		console.log(`submit`, analysis);
		message = '';
		error = '';

		const {analysisId} = $page.params
		const res = await fetch(`${base}/api/user/analyses/${analysisId}`, authenticateRequest($session, {
			method: 'PUT',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(analysis)
		}))
		working = false;
		if (res.ok) {
			message = "Updated";
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}
</script>

<AnalysisTabs analysis="{analysis}"/>
<div class="p-6">
	<form class="flex flex-col text-sm gap-4" on:submit|preventDefault={handleSubmit}>
		<label>
			<span class="font-light">Analysis name</span>
			<input bind:value="{analysis.name}" class="mt-1 block w-full" required type="text"/>
		</label>
		<label>
			<span class="font-light">Description</span>
			<textarea bind:value="{analysis.description}" class="mt-1 block w-full" rows="3" type="text"></textarea>
		</label>
		<label>
			<span class="font-light">Credits</span>
			<input bind:value="{analysis.credits}" class="mt-1 block w-full" type="text"/>
		</label>
		<div class="py-1">
			<label class="flex justify-center items-center">
				<input bind:checked="{analysis.isPublic}" class="form-checkbox" type="checkbox">
				<span class="ml-2">Public</span>
			</label>
		</div>

		{#if error}
			<div class="message-error">{error}</div>
		{/if}
		{#if message}
			<div class="message-success">{message}</div>
		{/if}

		<input class="button mt-1" disabled={working} type='submit' value='Save'>
	</form>
</div>
