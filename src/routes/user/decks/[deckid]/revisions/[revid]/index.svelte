<script context="module" lang="ts">
	import type {Load} from '@sveltejs/kit';
	
	export async function load({ page, fetch, session, context }): Load {
		const token = session.user?.token;
		if (!token) {
			console.log(`note, no user token`, session);
			return {
				props: { revisions: [] } 
			}
		}
		const {deckid, revid} = page.params;
		const url = `/api/user/decks/${deckid}/revisions/${revid}.json`;
		const res = await fetch(url, {
			headers: { authorization: `Bearer ${token}` }
		});

		if (res.ok) {
			return {
				props: {
					revision: (await res.json())
				}
			};
		}

		return {
			status: res.status,
			error: new Error(`Could not load ${url}`)
		};
	}
</script>

<script lang="ts">
import AppBar from '$lib/ui/AppBar.svelte';
import UserTabs from '$lib/ui/UserTabs.svelte';
import type {CardDeckRevision} from '$lib/types.ts';

export let revision : CardDeckRevision;
let working = false;

async function handleSubmit() {
	console.log(`IMPLEMENT ME: submit`, revision);
	working = true;
	// TODO
/*
        const response = await fetch(`/api/user/login`, {
                method:'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(request)
        });
        statusCode = response.status;
        working = false;
        if (statusCode == 200) {
        }
*/
}

</script>

<AppBar title="Cardographer" backpage=".."/>
<!-- <UserTabs/> -->

<div class="px-2 py-2">

<form on:submit|preventDefault={handleSubmit}>
<div class="grid grid-cols-1 gap-2 text-sm">
	<label class="block">
		<span class="font-light">Deck title</span>
		<input class="mt-1 block w-full" required id="deckName" type="text" bind:value="{revision.deckName}" />
	</label>
        <label class="block">
                <span class="font-light">Deck description</span>
                <textarea rows="3" class="mt-1 block w-full" id="deckDescription" type="text" bind:value="{revision.deckDescription}"></textarea>
        </label>
        <label class="block">
                <span class="font-light">Deck credits</span>
                <input class="mt-1 block w-full" id="deckCredits" type="text" bind:value="{revision.deckCredits}" />
        </label>
        <label class="block">
                <span class="font-light">Revision subtitle</span>
                <input class="mt-1 block w-full" id="revisionName" type="text" bind:value="{revision.revisionName}" />
        </label>
        <label class="block">
                <span class="font-light">Revision description</span>
                <textarea rows="3" class="mt-1 block w-full" id="revisionDescription" type="text" bind:value="{revision.revisionDescription}" ></textarea>
        </label>
        <label class="block">
                <span class="font-light">Slug (for filenames and URLs)</span>
                <input class="mt-1 block w-full" id="slug" type="text" bind:value="{revision.slug}" />
        </label>
	<div class="">
        <label class="inline-flex">
                <input type="checkbox" class="form-checkbox" bind:checked="{revision.isUsable}">
		<span class="ml-2">Usable</span>
        </label>
        <label class="inline-flex ml-6">
                <input type="checkbox" class="form-checkbox" bind:checked="{revision.isPublic}">
                <span class="ml-2">Public</span>
        </label>
        <label class="inline-flex ml-6">
                <input type="checkbox" class="form-checkbox" bind:checked="{revision.isLocked}">
                <span class="ml-2">Locked</span>
        </label>
        <label class="inline-flex ml-6">
                <input type="checkbox" class="form-checkbox" bind:checked="{revision.isTemplate}">
                <span class="ml-2">Template</span>
        </label>
	</div>

        <input disabled={working} class="rounded-md mt-1 block w-full bg-gray-300 py-2" class:text-gray-400="{working}" type='submit' value='Save'>
</div>

</form>

</div>
