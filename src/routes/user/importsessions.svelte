<script lang="ts">
import AppBar from '$lib/ui/AppBar.svelte';
import UserTabs from '$lib/ui/UserTabs.svelte';
import { page, session } from '$app/stores';
import { goto } from '$app/navigation';
import { base } from '$lib/paths';

let working = false;
let error = '';
let message = '';
let files;
let fileinput;

async function handleSubmit() {
	if (files.length==0) {
		console.log(`no file`);
		return;
	}
        error = message = '';
	const token = $session.user?.token;
	if (!token) {
		error = "Sorry, you don't seem to be logged in";
		return;
	}
	working = true;
	const jsondata = await files[0].text();
	const posturl = `${base}/api/user/sessions/import`;
	const res = await fetch(posturl, {
		method: 'POST',
		headers: { authorization: `Bearer ${token}`,
			'content-type': 'application/json' },
		body: jsondata
	});
	working = false;
	if (res.ok) {
		const info = await res.json();
		message = info.message;
		// redirect
		//goto(`sessions/${info.sessid}`);
		console.log(`imported`, info);
	} else {
		error = `Sorry, there was a problem (${res.statusText})`;
	}
}
</script>

<AppBar title="Cardographer" backpage=""/>
<UserTabs page="importsessions"/>

<div class="px-2 mt-2">

<form on:submit|preventDefault={handleSubmit}>
<div class="grid grid-cols-1 gap-2">
	<label class="block">
		<span>JSON Sessions files</span>
		<input class="mt-1 block w-full" required id="file" type="file" bind:files accept=".json,application/json" bind:this={fileinput}/>
	</label>

{#if error}
<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
{/if}
{#if message}
<div class="mt-1 border-green-500 bg-green-300 rounded-md w-full py-2 px-2">{message}</div>
{/if}

	<input disabled="{working}" class="rounded-md mt-1 block w-full bg-gray-300 py-2" class:text-gray-400="{working}" type='submit' value='Import'>
</div>
</form>

</div>
