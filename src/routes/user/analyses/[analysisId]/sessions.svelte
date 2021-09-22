<script context="module" lang="ts">
	import {base} from '$lib/paths';
	import {Analysis, SessionSnapshot} from "$lib/types";
	import type {LoadInput, LoadOutput} from '@sveltejs/kit';

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const token = session.user?.token;
		if (!token) {
			console.log(`note, no user token`, session);
			return {
				props: {analysis: null, snapshots: []}
			}
		}
		const headers = {headers: {authorization: `Bearer ${token}`}}
		const {analysisId} = page.params;
		const responses = await Promise.all([
			fetch(`${base}/api/user/analyses/${analysisId}`, headers),
			fetch(`${base}/api/user/snapshots`, headers)
		])

		if (responses.every((res) => res.ok)) {
			return {
				props: {
					analysis: await responses[0].json() as Analysis,
					snapshots: (await responses[1].json()).values as SessionSnapshot[]
				}
			}
		}

		console.log(responses)
		return {
			props: {
				snapshots: [],
				error: `Could not load file information`
			}
		}
	}
</script>

<script lang="ts">
	import AnalysisTabs from "$lib/ui/AnalysisTabs.svelte";
	import type {Analysis, SessionSnapshot} from '$lib/types.ts';
	import AnalysisSnapshotsForm from '$lib/ui/AnalysisSnapshotsForm.svelte';

	export let analysis: Analysis;
	export let snapshots: SessionSnapshot[];
</script>
<AnalysisTabs page="sessions" analysis="{analysis}"/>

<div class="p-6">
	<AnalysisSnapshotsForm analysis="{analysis}" snapshots="{snapshots}"/>
</div>