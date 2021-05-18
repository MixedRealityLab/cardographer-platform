<script lang="ts">
import type {CardDeckRevision} from '$lib/types.ts';
import type {PutCardsRequest} from '$lib/apitypes.ts';
import { page, session } from '$app/stores';

export let revision : CardDeckRevision;
let working = false;
let error = '';
let message = '';
let showform = false;
let files;
let addUnknown = false;

// submit form
async function handleSubmit() {
	if (files.length==0) {
		console.log(`no file`);
		return;
	}
        console.log(`submit`, files);
        message = '';
        error = '';

        const token = $session.user?.token;
        if (!token) {
                error = "Sorry, you don't seem to be logged in";
                return;
        }
        working = true;
        const {deckid, revid} = $page.params;
	const csvdata = await files[0].text();
	// defaults to UTF8
	const req: PutCardsRequest = {
		addColumns: addUnknown,
		csvFile: csvdata
	}
        const url = `/api/user/decks/${deckid}/revisions/${revid}/cards`;
        const res = await fetch(url, {
                method: 'PUT',
                headers: { authorization: `Bearer ${token}`,
                        'content-type': 'application/json' },
                body: JSON.stringify(req)
        });
        working = false;
        if (res.ok) {
                message = "Updated";
		//??revision = await res.body.json() as CardDeckRevision;
        } else {
                error = `Sorry, there was a problem (${res.statusText})`;
        }
}

</script>

<form on:submit|preventDefault={handleSubmit}>
<div class="grid grid-cols-1 gap-2">
	<label class="block">
		<span>Card CSV File:</span>
		<input class="mt-1 block w-full" required id="file" type="file" bind:files accept=".csv,text/csv"/>
	</label>
        <label class="block">
		<input type="checkbox" class="form-checkbox" bind:checked="{addUnknown}">
                <span class="ml-2">Add Extra Columns</span>
        </label>

{#if error}
<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
{/if}
{#if message}
<div class="mt-1 border-green-500 bg-green-300 rounded-md w-full py-2 px-2">{message}</div>
{/if}


	<input disabled={working} class="rounded-md mt-1 block w-full bg-gray-300 py-2" class:text-gray-400="{working}" type='submit' value='Upload'>
</div>

</form>


