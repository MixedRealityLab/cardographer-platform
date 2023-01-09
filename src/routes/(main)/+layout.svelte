<script lang="ts">
	import {base} from "$app/paths";
	import '$lib/global.css';
</script>

<style>
</style>

<svelte:head>
	<link crossorigin href="https://fonts.gstatic.com" rel="preconnect">
	<link href="{base}/cards.svg" rel="icon" type="image/svg">
	<link href="{base}/manifest.json" rel="manifest">
</svelte:head>

<div class="max-w-screen-md mx-auto bg-white min-h-screen">
	<slot></slot>
</div>
