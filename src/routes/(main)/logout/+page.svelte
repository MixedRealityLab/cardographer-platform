<script lang="ts">
	let statusCode = 0;
	let working = false;
</script>

<div class="p-2 max-w-md mx-auto bg-white min-h-screen">
	<h1>Log out</h1>

	<form method="post">
		<div class="grid grid-cols-1 gap-2">
			<!--suppress HtmlWrongAttributeValue -->
			<input disabled={working} class="mt-1 block w-full bg-gray-300 py-2" type='submit' value='Log out'>
		</div>
	</form>

	{#if statusCode}
		<p>Status: {statusCode}</p>
	{/if}

</div>
