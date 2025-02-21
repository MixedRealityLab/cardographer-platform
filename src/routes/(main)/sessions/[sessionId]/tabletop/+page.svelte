<script lang="ts" context="module">
	declare const UnityLoader
</script>

<script lang="ts">
	import {base} from "$app/paths";
	import {page} from "$app/stores"
	import {onMount} from "svelte";
	import {cubicOut} from 'svelte/easing'
	import {tweened} from "svelte/motion";
	import {fade} from 'svelte/transition'
	import SessionHeader from "../SessionHeader.svelte";
	import type {PageData} from './$types'

	export let data: PageData

	let unityInstance = null
	let progress = tweened(0, {
		duration: 200,
		easing: cubicOut
	})

	onMount(async () => {
		const {sessionId} = $page.params
		await progress.set(10)
		const res = await fetch(`${base}/sessions/${sessionId}/tabletop`)
		if (res.ok) {
			unityInstance = UnityLoader.instantiate("unityContainer", `${base}/tabletop/Build/BuildWebGL.json`, {onProgress: UnityProgress});
		}
	})

	function UnityProgress(unityInstance, newProgress: number) {
		if (!unityInstance.Module)
			return;
		progress.set((newProgress * 90) + 10)
	}
</script>

<svelte:head>
	<script src="{base}/tabletop/Build/UnityLoader.js"></script>
</svelte:head>

<style>
	#unityContainer {
		background: white !important;
	}
</style>

<SessionHeader session={data}>
	<button class="iconButton ml-3" on:click={unityInstance.SetFullscreen(1)} title="Fit Graph to Screen"
	        aria-label="Fit Graph to Screen">
		<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
			<path d="M3 8V4m0 0h4M3 4l4 4m8 0V4m0 0h-4m4 0l-4 4m-8 4v4m0 0h4m-4 0l4-4m8 4l-4-4m4 4v-4m0 4h-4"
			      stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
			      stroke-width="2"/>
		</svg>
	</button>
</SessionHeader>

<div class="flex flex-col items-center">
	<div class="relative">
		<div id="unityContainer" style="width: 960px; height: 600px;">
		</div>
		{#if $progress < 100}
			<div transition:fade class="absolute w-full top-0 h-full flex flex-col items-center justify-center">
				<div class="w-1/4 h-4 border border-blue-500 rounded">
					<div class="bg-blue-500 h-full transition-all duration-500" style="width: {$progress}%"></div>
				</div>
			</div>
		{/if}
	</div>
</div>