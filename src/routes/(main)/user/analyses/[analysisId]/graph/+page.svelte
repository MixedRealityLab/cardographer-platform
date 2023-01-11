<script lang="ts">
	import {base} from "$app/paths";
	import {page} from "$app/stores"
	import type {Analysis} from "$lib/types";
	import type {LayoutOptions, Css, ElementsDefinition} from "cytoscape"
	import cytoscape from "cytoscape";
	import {onMount} from "svelte"
	import AnalysisTabs from "../AnalysisTabs.svelte"
	import {fly} from 'svelte/transition';
	import RegionOptions from "./RegionOptions.svelte";

	const coolGray = {
		400: '#9ca3af',
		900: '#111827',
	}

	export let data: Analysis
	let selectedCard = null
	let graphElement: HTMLElement
	let graph: cytoscape.Core
	let layout: LayoutOptions = {
		name: 'circle',
		fit: true,
		//name: 'cose',
		//nodeDimensionsIncludeLabels: true,
		//nodeOverlap: 32,
		//idealEdgeLength: function( edge ){ return 32; }
	}
	let sidebar = false
	let sidebarWidth: number
	let regions = []

	async function fit(animate = false) {
		const newLayout = {
			...layout,
			animate: animate
		}
		graph.layout(newLayout).run()
		graph.nodes().removeClass('unused')
		graph.edges().removeClass('unused')
		//graph.fit(null, 30)
		selectedCard = null
	}

	async function zoomIn() {
		graph.zoom(graph.zoom() * 1.2)
	}

	async function zoomOut() {
		graph.zoom(graph.zoom() / 1.2)
	}

	function selectNode(e) {
		if (selectedCard && selectedCard.id === e.target.data().id) {
			selectedCard = null
			fit(true)
		} else {

			const edges = e.target.connectedEdges()
			const nodes = edges.connectedNodes().union(e.target)
			const edges2 = nodes.connectedEdges()

			selectedCard = e.target.data()

			nodes.removeClass('unused')
			edges2.removeClass('unused')
			graph.nodes().subtract(nodes).addClass('unused')
			graph.edges().subtract(edges2).addClass('unused')

			graph.layout({
				name: "concentric",
				animate: true,
				fit: false,
				nodeDimensionsIncludeLabels: true,
				concentric: function (node) {
					if (e.target.contains(node)) {
						return 100
					} else if (nodes.contains(node)) {
						return 10
					} else {
						return 1
					}
				},
			}).run()
		}
	}

	async function updateRegions() {
		const {analysisId} = $page.params
		const res = await fetch(`${base}/api/user/analyses/${analysisId}/graph`, {
			method: 'PUT',
			headers: {'content-type': 'application/json'},
			body: JSON.stringify(regions)
		})
		if (res.ok) {
			graph.json({
				elements: await res.json() as ElementsDefinition
			})
			graph.layout(layout).run()
		}
	}

	onMount(async () => {
		const {analysisId} = $page.params
		const res = await fetch(`${base}/api/user/analyses/${analysisId}/graph`, )
		if (res.ok) {
			const elements = await res.json() as ElementsDefinition
			regions = elements['regions']
			graph = cytoscape({
				elements: elements,
				container: graphElement,
				userZoomingEnabled: false,
				layout: layout,
				style: [
					{
						selector: 'node',
						style: {
							'width': 'data(size)',
							'height': 'data(size)',
							'background-color': 'data(colour)',
							'content': 'data(label)',
							'transition-property': 'background-opacity',
							'transition-duration': '0.5s'
						} as Css.Node
					},
					{
						selector: 'node.unused',
						style: {
							'background-opacity': 0.2
						}
					},
					{
						selector: 'edge',
						style: {
							'width': 'data(value)',
							'line-color': coolGray["400"],
							'curve-style': 'bezier',
							'transition-property': 'background-opacity',
							'transition-duration': '0.5s'
						} as Css.Edge
					},
					{
						selector: 'edge.unused',
						style: {
							'line-opacity': 0.2
						}
					},
					{
						selector: 'node[label]',
						style: {
							"color": coolGray["900"],
							"text-background-color": "#FFF",
							"text-background-opacity": 0.5,
							"text-background-padding": 2,
							"text-margin-y": -2,
							"text-background-shape": "round-rectangle",
						} as Css.Node
					}
				],
			})
			graph.nodes().on('tap', selectNode)
		}
	})
</script>

<AnalysisTabs analysis="{data}">
	{#if graph}
		<button class="iconButton ml-3" on:click={() => fit(true)} title="Fit Graph to Screen">
			<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
				<path d="M3 8V4m0 0h4M3 4l4 4m8 0V4m0 0h-4m4 0l-4 4m-8 4v4m0 0h4m-4 0l4-4m8 4l-4-4m4 4v-4m0 4h-4"
				      stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
				      stroke-width="2"/>
			</svg>
		</button>
		<button class="iconButton" on:click={zoomOut} title="Zoom Out">
			<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
				<path clip-rule="evenodd"
				      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
				      fill-rule="evenodd"/>
				<path clip-rule="evenodd" d="M5 8a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z" fill-rule="evenodd"/>
			</svg>
		</button>
		<button class="iconButton" on:click={zoomIn} title="Zoom In">
			<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
				<path d="M5 8a1 1 0 011-1h1V6a1 1 0 012 0v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0V9H6a1 1 0 01-1-1z"/>
				<path clip-rule="evenodd"
				      d="M2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8zm6-4a4 4 0 100 8 4 4 0 000-8z"
				      fill-rule="evenodd"/>
			</svg>
		</button>
		<button class="iconButton ml-3" on:click={() => {sidebar = !sidebar}} title="Configure Regions">
			<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
				<path clip-rule="evenodd"
				      d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
				      fill-rule="evenodd"/>
			</svg>
		</button>
	{/if}
</AnalysisTabs>
<div class="relative flex-1 overflow-hidden">
	<div bind:this={graphElement} class="absolute top-0 bottom-0 right-0 left-0">
	</div>
	{#if sidebar}
		<div transition:fly="{{ x: sidebarWidth, duration: 500 }}" bind:clientWidth={sidebarWidth}
		     class="max-w-md absolute overflow-y-auto right-0 top-0 bottom-0 p-6 bg-white border-l border-gray-200 backdrop-blur-sm flex flex-col gap-2"
		     style="background-color: rgba(255, 255, 255, 0.8)">
			{#if selectedCard}
				<div>
					<div class="font-semibold">{selectedCard.label}</div>
					<div class="text-sm">{selectedCard.description}</div>
				</div>
				<div>
					<div>Used {selectedCard.count} times</div>
					<div class="text-sm">Used in {selectedCard.zones.join(", ")}</div>
				</div>
				{#if selectedCard.comments.length > 0}
					<div class="font-semibold">Comments</div>
				{#each selectedCard.comments as comment}
					<div>{comment}</div>
				{/each}
					{/if}
				<div class="font-semibold mt-4">Board Regions</div>
			{/if}

			{#each regions as region}
				<RegionOptions region={region}/>
			{/each}
			<button class="button mt-2" on:click={updateRegions}>Save</button>
		</div>
	{/if}
</div>