<script lang="ts">
	import '$lib/global.css';
	import {base} from "$app/paths";
</script>

<style>
</style>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Lato&display=swap" rel="stylesheet">
	<link rel="icon" type="image/svg" href="{base}/cards.svg">
	<link rel="manifest" href="{base}/manifest.json">
</svelte:head>

<main class="container sm:container mx-auto">
	<div class="max-w-screen-md mx-auto bg-white min-h-screen">
		<slot></slot>
	</div>
</main>
