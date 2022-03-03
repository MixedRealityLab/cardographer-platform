<script type="ts">
	import {goto} from "$app/navigation";
	import {base} from '$app/paths'
	import {getStores} from '$app/stores';
	import type {LoginResponse} from '$lib/apitypes'
	import AppBar from "$lib/ui/AppBar.svelte";

	let password: string

	let error = ''
	let working = false;

	async function handleSubmit() {
		if (!password) {
			return;
		}
		working = true
		const response = await fetch(`${base}/api/user/login`, {
			method: 'POST',
			headers: {'content-type': 'application/json'},
			body: JSON.stringify({
				name: name,
				email: email,
				password: password,
				register: register,
				code: code
			})
		});
		if (response.ok) {
			const login = await response.json() as LoginResponse;
			if (login.error) {
				error = login.error;
				return;
			}
			const {session} = getStores()
			session.set({
				email: email,
				authenticated: true,
				token: login.token
			})
			await goto(`${base}/user/decks`)
			console.log(`logged in as ${email} with ${login.token}`)
		} else {
			error = 'Sorry, there was a problem logging in with those details. Please try again or contact the system administrator for help.'
		}
		working = false
	}

</script>

<div class="p-12 max-w-md mx-auto">
	<form on:submit|preventDefault={handleSubmit}>
		<div class="flex flex-col gap-8">
			<label>
				<span>New Password</span>
				<input bind:value="{password}" class="w-full" id="password" required type="password"/>
			</label>

			{#if error}
				<div class="message-error">{error}</div>
			{/if}

			<input class="button self-center" disabled={working} type='submit' value='Reset Password'>
		</div>
	</form>
</div>