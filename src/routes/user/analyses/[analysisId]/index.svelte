<script context="module" lang="ts">
	import {base} from '$lib/paths';
	import type {Analysis} from "$lib/types";
	import {errorResponse, authenticateRequest} from "$lib/ui/token";
	import type {LoadInput, LoadOutput} from '@sveltejs/kit';

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const {analysisId} = page.params;
		const res = await fetch(`${base}/api/user/analyses/${analysisId}`, authenticateRequest(session));
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
	import {page, session} from '$app/stores'
	import type {Analysis} from '$lib/types.ts'
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

		const token = $session.user?.token;
		if (!token) {
			error = "Sorry, you don't seem to be logged in";
			return;
		}
		working = true;

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

<AnalysisTabs analysis="{analysis}"/>
<div class="p-6">
	<form class="flex flex-col text-sm" on:submit|preventDefault={handleSubmit}>
		<label>
			<span class="font-light">Analysis name</span>
			<input class="mt-1 block w-full" required type="text" bind:value="{analysis.name}"/>
		</label>
		<label class="mt-2">
			<span class="font-light">Description</span>
			<textarea rows="3" class="mt-1 block w-full" type="text" bind:value="{analysis.description}"></textarea>
		</label>
		<label class="mt-2">
			<span class="font-light">Credits</span>
			<input class="mt-1 block w-full" type="text" bind:value="{analysis.credits}"/>
		</label>
		<div class="my-4">
			<label class="flex justify-center">
				<input type="checkbox" class="form-checkbox" bind:checked="{analysis.isPublic}">
				<span class="ml-2">Public</span>
			</label>
		</div>

		{#if error}
			<div class="message-error">{error}</div>
		{/if}
		{#if message}
			<div class="message-success">{message}</div>
		{/if}

		<input disabled={working} class="button mt-1" type='submit' value='Save'>
	</form>
</div>
