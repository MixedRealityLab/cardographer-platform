<script lang="ts">
	import Footer from '$lib/ui/Footer.svelte'
	export let data
</script>

<div class="container mx-auto bg-white min-h-screen flex flex-col" class:max-w-screen-md={!data.wide}>
	<div class="flex flex-col flex-grow">
	<slot></slot>
	</div>

	<Footer></Footer>
</div>

