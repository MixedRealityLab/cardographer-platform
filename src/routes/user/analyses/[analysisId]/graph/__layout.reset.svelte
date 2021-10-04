<script lang="ts">
	import '$lib/global.css';
</script>

<style>
</style>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Lato&display=swap" rel="stylesheet">
</svelte:head>

<main class="container sm:container mx-auto">
	<div class="min-w-screen mx-auto bg-white min-h-screen">
		<slot></slot>
	</div>
</main>
