<script lang="ts">
	import {base} from "$app/paths"
	import '$lib/global.css'

	export let data
</script>

<svelte:head>
	<link crossorigin href="https://fonts.gstatic.com" rel="preconnect">
	<link href="{base}/cards.svg" rel="icon" type="image/svg">
	<link href="{base}/manifest.json" rel="manifest">
</svelte:head>

<div class="container mx-auto bg-white min-h-screen" class:max-w-screen-md={!data.wide}>
	<slot></slot>
</div>
