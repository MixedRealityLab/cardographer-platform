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

	<div class="max-w-screen-md mx-auto bg-white min-h-screen">
		<slot></slot>
	</div>
