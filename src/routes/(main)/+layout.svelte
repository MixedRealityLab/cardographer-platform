<script lang="ts">
	import Footer from '$lib/ui/Footer.svelte'
	import type {PageData} from './$types'

	export let data: PageData
</script>

<div class="container mx-auto bg-white min-h-screen flex flex-col" class:max-w-screen-md={!data.wide}>
	<div class="flex flex-col flex-grow">
	<slot></slot>
	</div>

	<Footer></Footer>
</div>

