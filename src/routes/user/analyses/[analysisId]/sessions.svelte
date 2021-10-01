<script context="module" lang="ts">
	import {loadBase} from '$lib/paths'
	import {Analysis, SessionSnapshot} from "$lib/types";
	import {errorResponses, authenticateRequest} from "$lib/ui/token";
	import type {LoadInput, LoadOutput} from '@sveltejs/kit';

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const headers = authenticateRequest(session)
		const {analysisId} = page.params
		const responses = await Promise.all([
			fetch(`${loadBase}/api/user/analyses/${analysisId}`, headers),
			fetch(`${loadBase}/api/user/snapshots`, headers)
		])

		if (responses.every((res) => res.ok)) {
			return {
				props: {
					analysis: await responses[0].json() as Analysis,
					snapshots: (await responses[1].json()).values as SessionSnapshot[]
				}
			}
		}

		return errorResponses(responses)
	}
</script>

<script lang="ts">
	import AnalysisTabs from "./_AnalysisTabs.svelte"
	import type {Analysis, SessionSnapshot} from '$lib/types'
	import AnalysisSnapshotsForm from '$lib/ui/AnalysisSnapshotsForm.svelte'

	export let analysis: Analysis;
	export let snapshots: SessionSnapshot[];
</script>
<AnalysisTabs analysis="{analysis}"/>

<div class="p-6">
	<AnalysisSnapshotsForm analysis="{analysis}" snapshots="{snapshots}"/>
</div>