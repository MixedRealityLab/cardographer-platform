<script type="ts">
	import {base} from '$app/paths'
	import AppBar from "../../../lib/ui/AppBar.svelte";

	let email: string

	let error = ''
	let working = false
	let reset = false

	async function handleSubmit() {
		if (!email) {
			return;
		}
		working = true
		const response = await fetch(`${base}/api/user/password/forgotten`, {
			method: 'POST',
			headers: {'content-type': 'application/json'},
			body: JSON.stringify({
				email: email
			})
		});
		if (response.ok) {
			reset = true
		} else {
			error = 'Sorry, there was a problem logging in with those details. Please try again or contact the system administrator for help.'
		}
		working = false
	}

</script>

<AppBar back="{base}/"/>

<div class="p-12 max-w-md mx-auto">
	<form on:submit|preventDefault={handleSubmit}>
		<div class="flex flex-col gap-8">
			<label>
				<span>Email</span>
				<input bind:value="{email}" disabled={working || reset} class="w-full" required type="email"/>
			</label>

			{#if error}
				<div class="message-error">{error}</div>
			{/if}
			{#if reset}
				<div class="message-success">An email has been sent to the above account</div>
			{/if}
			<input class="button self-center" disabled={working || reset} type='submit' value='Reset Password'>
		</div>
	</form>
</div>