<script context="module" lang="ts">
	import {loadBase} from '$lib/paths'
	import type {Analysis} from "$lib/types";
	import {authenticateRequest, errorResponse} from "$lib/ui/token";
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
	import {page, session} from "$app/stores"
	import cytoscape, {Css, StylesheetStyle} from "cytoscape"
	import type {ElementsDefinition} from "cytoscape"
	import {onMount} from "svelte"
	import AnalysisTabs from "../_AnalysisTabs.svelte"

	export let analysis: Analysis
	let graphElement: HTMLElement

	onMount(async () => {
		const {analysisId} = $page.params
		const res = await fetch(`${base}/api/user/analyses/${analysisId}/graph`, authenticateRequest($session))
		if (res.ok) {
			cytoscape({
				elements: await res.json() as ElementsDefinition,
				container: graphElement,
				layout: {
					name: 'circle',
				},
				style: [
					{
						selector: 'node',
						style: {
							'width': 20,
							'height': 20,
							'background-color': 'data(colour)',
							'content': 'data(label)'
						}
					},
					{
						selector: 'edge',
						style: {
							'width': 'data(value)',
							'line-color': '#333',
							'curve-style': 'bezier'
						}
					},
					{
						selector: 'node[label]',
						style: {
							"color": "#111",
							"text-background-color": "#FFF",
							"text-background-opacity": 0.5,
							"text-background-padding": 2,
							"text-margin-y": -2,
							"text-background-shape": "round-rectangle",
						} as Css.Node
					}
				],
			})
		}
	})
</script>

<AnalysisTabs analysis="{analysis}"/>
<div bind:this={graphElement} style="height: 800px">
</div>
