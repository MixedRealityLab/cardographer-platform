<script lang="ts">
	import type {AnalysisRegion} from "$lib/types";
	import {RegionType} from "$lib/types";

	export let region: AnalysisRegion
	//export let subregions = []
</script>

<label>
	<span>{region.name || 'Not in a Region' }</span>
	<select name="region" bind:value={region.type} class="w-full">
		<option value="{RegionType.Category}">Colour by Card Category</option>
		<!--{#if subregions && subregions.length > 0}-->
		<!--	<option value="{RegionType.SubRegions}">Organize by Sub-Regions</option>-->
		<!--{/if}-->
		<option value="{RegionType.XAxis}">Colour by X-Axis</option>
		<option value="{RegionType.YAxis}">Colour by Y-Axis</option>
		<!--<option value="{RegionType.SingleColour}">Single Colour</option>-->
		<option value="{RegionType.Ignore}">Ignore</option>
	</select>
</label>
{#if region.type === RegionType.SingleColour}
	<label>
		<span>Colour</span>
		<input type="color">
	</label>
{/if}