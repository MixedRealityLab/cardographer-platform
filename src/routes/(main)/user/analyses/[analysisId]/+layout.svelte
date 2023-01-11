<script lang="ts">
	import {page} from '$app/stores'
	import type {Analysis} from "$lib/types"
	import AnalysisTabs from "./AnalysisTabs.svelte";

	export let data: Analysis
	let {analysisId} = $page.params
</script>

<AnalysisTabs analysis={data} />

<slot/>