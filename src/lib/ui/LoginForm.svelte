<script type="ts">
import type {LoginRequest, LoginResponse} from '$lib/apitypes.ts';
import type {UserSession} from '$lib/systemtypes.ts';
import {session} from '$app/stores';

let email:string;
let password:string;
let statusCode = "";
let error = '';
let working = false;

async function handleSubmit() {
	if (!email) {
		return;
	}
	const request:LoginRequest = {
		email: email,
		password: password
	};
	const response = await fetch(`/api/user/login`, {
		method:'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(request)
	});
	let statusCode = response.status;
	working = false;
	if (statusCode == 200) {
		const login = await response.json() as LoginResponse;
		const user:UserSession = {
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

<h1>Log in</h1>

<form on:submit|preventDefault={handleSubmit}>
  <div class="grid grid-cols-1 gap-2">
    <label class="block">
      <span>Email</span>
      <input class="mt-1 block w-full" required id="email" type="text" bind:value="{email}" />
    </label>
    <label class="block">
      <span>Password</span>
      <input class="mt-1 block w-full" required id="password" type="password" bind:value="{password}" />
    </label>

{#if error}
<div class="m-2 p-2 bg-red-300 rounded-lg text-center">{error}</div>
{/if}

    <input disabled={working} class="mt-1 block w-full bg-gray-300 py-2" type='submit' value='Log in'>
</form>

</div>
