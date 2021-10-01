<script type="ts">
	import {goto} from "$app/navigation";
	import {session} from '$app/stores';
	import type {LoginResponse} from '$lib/apitypes'
	import {base} from '$app/paths'
	import type {UserSession} from '$lib/systemtypes'
	import AppBar from "$lib/ui/AppBar.svelte";

	let name: string
	let email: string
	let password: string
	let code: string

	let statusCode = "";
	let error = ''
	let working = false;
	let register = false;

	async function handleSubmit() {
		if (!email) {
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
		working = false
		if (response.ok) {
			const login = await response.json() as LoginResponse;
			if (login.error) {
				error = login.error;
				return;
			}
			const user: UserSession = {
				email: email,
				authenticated: true,
				token: login.token
			};
			$session.user = user
			await goto(`${base}/user/decks`)
			console.log(`logged in as ${email} with ${user.token}`)
		} else {
			error = 'Sorry, there was a problem logging in with those details. Please try again or contact the system administrator for help.'
		}
	}

</script>

<style>
    .tab {
        @apply px-4 rounded-t py-1 cursor-pointer transition-colors duration-500 mx-0;
    }

    .tabSelected {
        @apply bg-gray-300 cursor-default text-gray-900;
    }

    .tab:hover:not(.tabSelected) {
        @apply bg-gray-500;
    }
</style>

<AppBar>
	<button class="tab" class:tabSelected="{!register}" on:click={() => register = false}>
		Login
	</button>
	<button class="tab" class:tabSelected="{register}" on:click={() => register = true}>
		Register
	</button>
</AppBar>

<div class="p-6 max-w-md mx-auto">
	<form on:submit|preventDefault={handleSubmit}>
		<div class="flex flex-col">
			{#if register}
				<label class="mt-2">
					<span>Name</span>
					<input class="w-full" required id="name" type="text" bind:value="{name}"/>
				</label>
			{/if}
			<label class="mt-2">
				<span>Email</span>
				<input class="w-full" required id="email" type="text" bind:value="{email}"/>
			</label>
			<label class="mt-2">
				<span>Password</span>
				<input class="w-full" required id="password" type="password" bind:value="{password}"/>
			</label>

			{#if register}
				<label class="mt-2">
					<span>Registration code</span>
					<input class="w-full" required id="code" type="password" bind:value="{code}"/>
				</label>
			{/if}

			{#if error}
				<div class="message-error">{error}</div>
			{/if}

			<input disabled={working} class="button self-center mt-4" type='submit'
			       value='{register ? "Register" : "Log in"}'>
		</div>
	</form>
</div>