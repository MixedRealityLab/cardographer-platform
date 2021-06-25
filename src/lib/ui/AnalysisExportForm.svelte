<script lang="ts">
import type {Analysis} from '$lib/types.ts';
import { page, session } from '$app/stores';
import { base } from '$lib/paths';
import { AnalysisExportTypes } from '$lib/analysistypes.ts';

export let analysis : Analysis;
let exportOption = [ AnalysisExportTypes.CARD_USE,
	AnalysisExportTypes.CARD_ADJACENCY ];
let exportType: AnalysisExportTypes = AnalysisExportTypes.CARD_USE;
let working = false;
let error = '';
let message = '';

//https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
function download(filename, text) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

async function exportCsv() {
	console.log(`export...`);
	message = error = '';
	const token = $session.user?.token;
	if (!token) {
		error = "Sorry, you don't seem to be logged in";
		return;
	}
	working = true;
	const {analid} = $page.params;
	let url = `${base}/api/user/analyses/${analid}/gephy.csv?type=${exportType}`;
	const res = await fetch(url, {
                headers: { authorization: `Bearer ${token}` },
        });
        working = false;
        if (res.ok) {
		const text = await res.text();
		let filename = `${analysis.name}.csv`;
		download(filename, text);
        } else {
                error = `Sorry, there was a problem (${res.statusText})`;
        }

}

</script>

<div class="py-2 grid grid-cols-1 gap-2">
	<select bind:value={exportType}>
		{#each exportOption  as option}
			<option value={option}>
				{option}
			</option>
		{/each}
	</select>


{#if error}
<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
{/if}
{#if message}
<div class="mt-1 border-green-500 bg-green-300 rounded-md w-full py-2 px-2">{message}</div>
{/if}
    
    <button disabled={working} class:text-gray-400="{working}" class="rounded-md mt-1 block w-full bg-gray-300 py-2" on:click="{exportCsv}">Export CSV</button>

</div>
