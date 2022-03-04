<script type="ts">
	import {goto} from "$app/navigation";
	import {base} from '$app/paths'
	import type {LoginResponse} from '$lib/apitypes'
	import AppBar from "$lib/ui/AppBar.svelte";

	let name: string
	let email: string
	let password: string
	let code: string

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
		if (response.ok) {
			const login = await response.json() as LoginResponse;
			if (login.error) {
				error = login.error;
				return;
			}
			await goto(`${base}/user/decks`)
			console.log(`logged in as ${email} with ${login.token}`)
		} else {
			error = 'Sorry, there was a problem logging in with those details. Please try again or contact the system administrator for help.'
		}
		working = false
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

<div class="p-12 max-w-md mx-auto">
	<form on:submit|preventDefault={handleSubmit}>
		<div class="flex flex-col gap-8">
			{#if register}
				<label>
					<span>Name</span>
					<input bind:value="{name}" class="w-full" required id="name" type="text"/>
				</label>
			{/if}
			<label>
				<span>Email</span>
				<input bind:value="{email}" class="w-full" id="email" required type="text"/>
			</label>
			<label>
				<span>Password</span>
				<input bind:value="{password}" class="w-full" id="password" required type="password"/>
				{#if !register}
					<div class="flex flex-col">
					<a href="{base}/user/password/forgotten" class="text-sm self-center pt-2 text-gray-700 hover:underline">forgot password</a>
					</div>
					{/if}
			</label>

			{#if register}
				<label>
					<span>Registration code</span>
					<input bind:value="{code}" class="w-full" id="code" required type="password"/>
				</label>
			{/if}

			{#if error}
				<div class="message-error">{error}</div>
			{/if}

			<input class="button self-center" disabled={working} type='submit'
			       value='{register ? "Register" : "Log in"}'>
		</div>
	</form>
</div>