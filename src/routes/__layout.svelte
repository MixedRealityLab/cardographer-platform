<script lang="ts">
	import GlobalStyle from "$lib/GlobalStyle.svelte";
</script>

<style>
</style>

<!-- I tried setting base but it broke client navigation at least in dev -->

<GlobalStyle/>

<main>
	<div class="container sm:container mx-auto">
		<slot></slot>
	</div>
</main>
