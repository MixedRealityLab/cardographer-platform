<script context="module" lang="ts">
	import {loadBase} from '$lib/paths'
	import {authenticateRequest, errorResponse} from "$lib/ui/token";
	import type {LoadInput, LoadOutput} from '@sveltejs/kit';

	export async function load({fetch, session}: LoadInput): Promise<LoadOutput> {
		const res = await fetch(`${loadBase}/api/user/analyses`, authenticateRequest(session));

		if (res.ok) {
			return {
				props: {
					analyses: (await res.json()).values.sort(compareAnalyses)
				}
			};
		}

		return errorResponse(res)
	}

	function compareAnalyses(a, b) {
		const aName = `${a.name} ${a.owners[0]} ${a.created}`;
		const bName = `${b.name} ${b.owners[0]} ${b.created}`;
		return String(aName).localeCompare(bName);
	}

</script>

<script lang="ts">
	import {base} from '$app/paths'
	import UserTabs from '$lib/ui/UserTabs.svelte'
	import type {Analysis} from '$lib/types'
	import {session} from '$app/stores'
	import {goto} from '$app/navigation'

	export let analyses: Analysis[];
	let error = '';
	let working = false;

	async function newAnalysis() {
		error = ''
		working = true
		const analysis: Analysis = {
			_id: '',
			name: 'New Analysis',
			isPublic: false,
			created: "",
			lastModified: new Date().toISOString(),
			owners: [],
			snapshotIds: [],
			regions: []
		}
		let res = await fetch(`${base}/api/user/analyses`, authenticateRequest($session,{
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(analysis)
		}));
		working = false;
		if (res.ok) {
			const info = await res.json();
			// redirect
			await goto(`analyses/${info.analysisId}`);
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}

</script>

<UserTabs/>

<div class="flex flex-col p-6 w-full text-sm font-medium gap-4">
	{#each analyses as analysis}
		<a class="listItem items-center" href="analyses/{analysis._id}">
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

	<button disabled={working} class="button self-center" on:click="{newAnalysis}">
		<img src="{base}/icons/add.svg" class="w-4 mr-1" alt=""/>New Analysis
	</button>

</div>
