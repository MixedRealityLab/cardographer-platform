<script type="ts">
	import {page, session} from '$app/stores';
	import type {BuildResponse} from '$lib/apitypes';
	import {base} from '$lib/paths';
	import type {CardDeckRevision} from '$lib/types';
	import {DeckBuildStatus} from "$lib/types";

	export let revision: CardDeckRevision;

	let working = false;
	let message = '';
	let error = '';
	let buildMessages = '';

	//revision.build.messages?.join('\n');

	async function handleSubmit() {
		message = error = '';
		const token = $session.user?.token;
		if (!token) {
			alert("Sorry, you don't seem to be logged in");
			return;
		}
		working = true;
		const {deckid, revid} = $page.params;
		const url = `${base}/api/user/decks/${deckid}/revisions/${revid}/build`;
		revision.build.status = DeckBuildStatus.Building;
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				authorization: `Bearer ${token}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify({})
		});
		working = false;
		if (res.ok) {
			//message = 'OK';
			const output = await res.json() as BuildResponse;
			if (output.error) {
				error = output.error;
				revision.build.status = DeckBuildStatus.Failed;
			} else {
				message = 'OK';
				revision.build.status = DeckBuildStatus.Built;
				revision.build.lastBuilt = new Date().toISOString();
			}
			buildMessages = output.messages?.join('\n');
			revision.messages = output.messages;
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
			revision.build.status = DeckBuildStatus.Failed;
		}
	}

</script>

{#if revision?.build}
	<form on:submit|preventDefault={handleSubmit}>
		<div class="grid grid-cols-1 gap-2 text-sm">
			<label class="block">
				<span class="font-light">Builder</span>
				<input readonly class="mt-1 block w-full" required type="text"
				       bind:value="{revision.build.builderName}"/>
			</label>
			<label class="inline">
				<span class="font-light">Build status:</span>
				<span>{revision.build.status}</span>
				{#if revision.build.lastBuilt}({revision.build.lastBuilt}){/if}
			</label>

			<label class="block">
				<span class="font-light">Build messages:</span>
				<textarea readonly rows="3" class="mt-1 block w-full" type="text"
				          bind:value="{buildMessages}"></textarea>
			</label>

			{#if error}
				<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
			{/if}
			{#if message}
				<div class="mt-1 border-green-500 bg-green-300 rounded-md w-full py-2 px-2">{message}</div>
			{/if}
			<input disabled={working || revision.build.isDisabled || revision?.isLocked}
			       class="rounded-md mt-1 block w-full bg-gray-300 py-2"
			       class:text-gray-400="{working || revision.build.isDisabled || revision?.isLocked}" type='submit'
			       value='Build'>
		</div>
	</form>
{:else}
	{#if revision}
		<div>Sorry, build isn't set up for this deck</div>
	{/if}
{/if}
