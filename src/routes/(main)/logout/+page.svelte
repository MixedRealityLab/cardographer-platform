<script lang="ts">
	import {enhance} from "$app/forms"
	import AppBar from "$lib/ui/AppBar.svelte"
	let statusCode = 0;
	let working = false;
</script>

<AppBar></AppBar>

<div class="p-2 max-w-md mx-auto bg-white min-h-screen">

	<form method="post" use:enhance={() => {
		working = true
		return async ({ result, update }) => {
			//working = false
			statusCode = result.status
			update()
	    };
	}}>
		<div class="grid grid-cols-1 gap-2">
			<!--suppress HtmlWrongAttributeValue -->
			<input disabled={working} class="mt-1 block w-full bg-gray-300 py-2" type='submit' value='Log out'>
		</div>
	</form>

	{#if statusCode}
		<p>Status: {statusCode}</p>
	{/if}

</div>
