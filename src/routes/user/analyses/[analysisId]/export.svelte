<script context="module" lang="ts">
	import {loadBase} from '$lib/paths'
	import type {Analysis} from "$lib/types";
	import {errorResponse, authenticateRequest} from "$lib/ui/token";
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
	import {AnalysisExportTypes} from '$lib/analysistypes'
	import type {Analysis} from '$lib/types'
	import AnalysisTabs from "./_AnalysisTabs.svelte"

	export let analysis: Analysis
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

	//https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
	function download(filename, text) {
		const element = document.createElement('a');
		element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	}

	function prettifyEnum(type: AnalysisExportTypes): string {
		if (type == AnalysisExportTypes.CARD_USE) {
			return 'Card Use'
		} else {
			return 'Card Adjacency'
		}
	}

	async function exportCsv() {
		console.log(`export...`);
		message = error = '';
		working = true;
		const {analysisId} = $page.params;
		let url = `${base}/api/user/analyses/${analysisId}/gephy.csv?type=${exportType}`;
		if (splitByBoard) {
			url = url + '&splitByBoard';
		}
		if (includeDetail) {
			url = url + '&includeDetail';
		}
		if (boards) {
			url = url + '&boards=' + encodeURIComponent(boards);
		}
		const res = await fetch(url, authenticateRequest($session))
		working = false;
		if (res.ok) {
			const text = await res.text();
			let filename = `${analysis.name}.csv`
			const disposition = res.headers.get('Content-Disposition')
			if (disposition) {
				const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
				const matches = filenameRegex.exec(disposition);
				if (matches != null && matches[1]) {
					filename = matches[1].replace(/['"]/g, '');
				}
			}
			download(filename, text);
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}

	}

</script>

<AnalysisTabs analysis="{analysis}"/>

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

		<button disabled={working} class="button self-center mt-4" on:click="{exportCsv}">
			Export CSV
		</button>
	</div>
</div>
