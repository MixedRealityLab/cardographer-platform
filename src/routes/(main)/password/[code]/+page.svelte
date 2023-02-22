<script lang="ts">
	import {base} from '$app/paths'
	import {page} from '$app/stores'
	import AppBar from "$lib/ui/AppBar.svelte"

	let password: string

	let error = ''
	let working = false
	let success = false

	async function handleSubmit() {
		if (!password) {
			return;
		}
		const code = $page.params.code
		working = true
		const response = await fetch(`${base}/api/user/password/update`, {
			method: 'POST',
			headers: {'content-type': 'application/json'},
			body: JSON.stringify({
				code: code,
				password: password,
			})
		});
		if (response.ok) {
			success = true
		} else {
			error = 'Sorry, there was a problem resetting your password'
		}
		working = false
	}

</script>

<AppBar back="{base}/"/>

<div class="p-12 max-w-md mx-auto">
	<form on:submit|preventDefault={handleSubmit}>
		<div class="flex flex-col gap-8">
			<label>
				<span>New Password</span>
				<input bind:value="{password}" class="w-full" disabled={working || success} required type="password" autocomplete="new-password"/>
			</label>

			{#if error}
				<div class="message-error">{error}</div>
			{:else if success}
				<a class="message-success" href="{base}/">
					Password Changed. You should now be able to login again
				</a>
			{/if}

			<input class="button self-center" disabled={working || success} type='submit' value='Set New Password'>
		</div>
	</form>
</div>