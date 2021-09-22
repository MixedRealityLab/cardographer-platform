<script context="module" lang="ts">
	import {base} from '$lib/paths.ts';
	import type {LoadInput, LoadOutput} from '@sveltejs/kit';

	export async function load({fetch, session}: LoadInput): Promise<LoadOutput> {
		const token = session.user?.token;
		if (!token) {
			console.log(`note, no user token`, session);
			return {
				props: {decks: []}
			}
		}
		const url = `${base}/api/user/analyses`;
		const res = await fetch(url, {
			headers: {authorization: `Bearer ${token}`}
		});

		if (res.ok) {
			return {
				props: {
					analyses: (await res.json()).values.sort(compareAnalyses)
				}
			};
		}

		return {
			status: res.status,
			error: new Error(`Could not load ${url}`)
		};
	}

	function compareAnalyses(a, b) {
		const aName = `${a.name} ${a.owners[0]} ${a.created}`;
		const bName = `${b.name} ${b.owners[0]} ${b.created}`;
		return String(aName).localeCompare(bName);
	}

</script>

<script lang="ts">
	import AppBar from '$lib/ui/AppBar.svelte';
	import UserTabs from '$lib/ui/UserTabs.svelte';
	import type {Analysis} from '$lib/types';
	import {session} from '$app/stores';
	import {goto} from '$app/navigation';

	export let analyses: Analysis[];
	let error = '';
	let working = false;

	async function newAnalysis() {
		error = '';
		const token = $session.user?.token;
		if (!token) {
			error = "Sorry, you don't seem to be logged in";
			return;
		}
		working = true;
		const url = `${base}/api/user/analyses`;
		const analysis: Analysis = {
			_id: '',
			name: 'New Analysis',
			isPublic: false,
			created: "",
			lastModified: new Date().toISOString(),
			owners: [],
			snapshots: []
		};
		let res = await fetch(url, {
			method: 'POST',
			headers: {
				authorization: `Bearer ${token}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify(analysis)
		});
		working = false;
		if (res.ok) {
			const info = await res.json();
			// redirect
			goto(`analyses/${info.analid}`);
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}

</script>

<UserTabs page="analyses"/>

<div class="flex flex-col p-4 w-full text-sm font-medium">
	{#each analyses as analysis}
		<a class="listItem flex-col" href="analyses/{analysis._id}">
			<div>{analysis.name}</div>
			<div class="flex flex-row gap-1">
				{#if analysis.isPublic}
					<div class="chip">Public</div>
				{/if}
			</div>
			<div class="text-sm font-light">{analysis.description}</div>
		</a>
	{/each}

	{#if error}
		<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
	{/if}

	<button disabled={working} class:text-gray-400="{working}"
	        class="button mt-4 self-center" on:click="{newAnalysis}">
		<img src="{base}/icons/add.svg" class="w-4 mr-1" alt=""/>New Analysis
	</button>

</div>
