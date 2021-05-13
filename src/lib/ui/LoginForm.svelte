<script type="ts">
import type {LoginRequest, LoginResponse} from '$lib/apitypes.ts';
import type {UserSession} from '$lib/systemtypes.ts';
import {session} from '$app/stores';

let email:string;
let statusCode = "";
let working = false;

async function handleSubmit() {
	if (!email) {
		return;
	}
	const request:LoginRequest = {
		email: email
	};
	const response = await fetch(`/api/user/login`, {
		method:'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(request)
	});
	statusCode = response.status;
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
    <input disabled={working} class="mt-1 block w-full bg-gray-300 py-2" type='submit' value='Log in'>
</form>

{#if statusCode}
<p>Status: {statusCode}</p>
{/if}

</div>
