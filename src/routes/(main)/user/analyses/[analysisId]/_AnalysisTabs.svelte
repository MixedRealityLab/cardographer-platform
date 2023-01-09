<script lang="ts">
	import {goto} from "$app/navigation";
	import {base} from '$app/paths'
	import {page} from "$app/stores";
	import type {Analysis} from "$lib/types"
	import AppBar from "$lib/ui/AppBar.svelte"
	import ConfirmDialog from "$lib/ui/ConfirmDialog.svelte";
	import Tab from "$lib/ui/Tab.svelte"

	export let analysis: Analysis
	let {analysisId} = $page.params

	async function deleteAnalysis() {
		const res = await fetch(`${base}/api/user/analyses/${analysisId}`, {
			method: 'DELETE'
		})
		if (res.ok) {
			await goto(`${base}/user/analyses`)
		}
	}
</script>

<AppBar back="{base}/user/analyses">
	<Tab url="{base}/user/analyses/{analysisId}">
		Details
	</Tab>
	<Tab url="{base}/user/analyses/{analysisId}/sessions">
		Sessions
	</Tab>
	<Tab url="{base}/user/analyses/{analysisId}/export">
		Export
	</Tab>
	<Tab url="{base}/user/analyses/{analysisId}/graph">
		Graph
	</Tab>
	<div class="flex items-center" slot="subheader">
		<div class="flex-1">{analysis.name}</div>
		<ConfirmDialog
				cancelTitle="Cancel"
				confirmTitle="Delete"
				let:confirm="{confirmThis}"
				title="Delete {analysis.name}?">
			<button class="iconButton" on:click={() => confirmThis(deleteAnalysis)}
			        title='Delete Session'>
				<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
					<path clip-rule="evenodd"
					      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
					      fill-rule="evenodd"/>
				</svg>
			</button>
		</ConfirmDialog>
		<slot/>
	</div>
</AppBar>

