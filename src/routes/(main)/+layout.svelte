<script lang="ts">
	export let data
</script>

<div class="container mx-auto bg-white min-h-screen" class:max-w-screen-md={!data.wide}>
	<slot></slot>
</div>
