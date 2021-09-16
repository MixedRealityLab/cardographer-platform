<script type="ts">
	import {session} from '$app/stores';
	import type {LoginRequest, LoginResponse} from '$lib/apitypes.ts';
	import {base} from '$lib/paths';
	import type {UserSession} from '$lib/systemtypes.ts';

	let email: string;
	let password: string;
	let code: string;
	let statusCode = "";
	let error = '';
	let working = false;
	let register = false;

	async function handleSubmit() {
		if (!email) {
			return;
		}
		const request: LoginRequest = {
			email: email,
			password: password,
			register: register,
			code: code
		};
		const response = await fetch(`${base}/api/user/login`, {
			method: 'POST',
			headers: {'content-type': 'application/json'},
			body: JSON.stringify(request)
		});
		let statusCode = response.status;
		working = false;
		if (statusCode == 200) {
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
			$session.user = user;
			console.log(`logged in as ${email} with ${user.token}`);
		} else {
			error = 'Sorry, there was a problem loggin in with those details. Please try again or contact the system administrator for help.';
		}
	}

</script>

<div class="px-2">

	<h1>{register ? 'Register' : 'Log in'}</h1>

	<form on:submit|preventDefault={handleSubmit}>
		<div class="grid grid-cols-1 gap-2">
			<label class="block">
				<span>Email</span>
				<input class="mt-1 block w-full" required id="email" type="text" bind:value="{email}"/>
			</label>
			<label class="block">
				<span>Password</span>
				<input class="mt-1 block w-full" required id="password" type="password" bind:value="{password}"/>
			</label>

			<label class="block">
				<input type="checkbox" class="form-checkbox" bind:checked="{register}">
				<span class="ml-2">Register as a new user</span>
			</label>
			{#if register}
				<label class="block">
					<span>Registration code</span>
					<input class="mt-1 block w-full" required id="code" type="password" bind:value="{code}"/>
				</label>
			{/if}

			{#if error}
				<div class="m-2 p-2 bg-red-300 rounded-lg text-center">{error}</div>
			{/if}

			<input disabled={working} class="mt-1 block w-full bg-gray-300 py-2" type='submit'
			       value='{register ? "Register" : "Log in"}'>
		</div>
	</form>

</div>
