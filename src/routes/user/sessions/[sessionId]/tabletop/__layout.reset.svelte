<script lang="ts">
	import '$lib/global.css';
	import {base} from "$app/paths";
</script>

<style>
</style>

<svelte:head>
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link rel="icon" type="image/svg" href="{base}/cards.svg">
	<link rel="manifest" href="{base}/manifest.json">
</svelte:head>

<main class="max-w-5xl mx-auto">
	<div class="mx-auto bg-white min-h-screen flex flex-col">
		<slot></slot>
	</div>
</main>
