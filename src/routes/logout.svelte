<script type="ts">
	import {session} from '$app/stores'
	import {base} from '$lib/paths'

	let statusCode = 0;
	let working = false;

	async function handleSubmit() {
		const response = await fetch(`${base}/api/user/logout`, {
			method: 'POST',
			headers: {'content-type': 'application/json'},
			body: JSON.stringify({})
		});
		statusCode = response.status;
		working = false;
		if (statusCode == 200) {
			$session.user = {
				authenticated: false
			};
			console.log(`logged out`);
		}
	}

</script>

<div class="p-2 max-w-md mx-auto bg-white min-h-screen">

	<h1>Log out</h1>

	<form on:submit|preventDefault={handleSubmit}>
		<div class="grid grid-cols-1 gap-2">
			<input disabled={working} class="mt-1 block w-full bg-gray-300 py-2" type='submit' value='Log out'>
		</div>
	</form>

	{#if statusCode}
		<p>Status: {statusCode}</p>
	{/if}

</div>
