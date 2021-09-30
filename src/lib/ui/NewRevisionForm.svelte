<script type="ts">
	import {goto} from '$app/navigation';
	import {page, session} from '$app/stores';
	import type {PostUserRevisionResponse} from '$lib/apitypes';
	import {base} from '$lib/paths';
	import type {CardDeckRevision} from '$lib/types';

	export let revision: CardDeckRevision;

	let working = false;
	let message = '';
	let error = '';

	async function handleSubmit() {
		message = error = '';
		const token = $session.user?.token;
		if (!token) {
			alert("Sorry, you don't seem to be logged in");
			return;
		}
		working = true;
		// get latest value
		const getres = await fetch(`${base}/api/user/decks/${revision.deckId}/revisions/${revision.revision}.json`)
		if (!getres.ok) {
			error = `Sorry, couldn't get the latest version of this revision (${getres.statusText})`;
			working = false;
			return;
		}
		const newRevision = await getres.json() as CardDeckRevision
		const {deckId} = $page.params;
		newRevision.revisionName = 'New revision';
		newRevision.revisionDescription = `Based on revision ${revision.revision} of ${revision.deckName}`;
		newRevision.slug = '';
		const url = `${base}/api/user/decks/${deckId}/revisions`;
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				authorization: `Bearer ${token}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify(newRevision)
		});
		working = false;
		if (res.ok) {
			revision.isCurrent = false;
			const output = await res.json() as PostUserRevisionResponse;
			message = 'OK';
			// redirect
			await goto(`${output.revId}`);
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}

</script>

{#if revision?.isCurrent}
	<form on:submit|preventDefault={handleSubmit}>
		<div class="grid grid-cols-1 gap-2 text-sm">

			{#if error}
				<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
			{/if}
			{#if message}
				<div class="mt-1 border-green-500 bg-green-300 rounded-md w-full py-2 px-2">{message}</div>
			{/if}
			<input disabled={working} class="rounded-md mt-1 block w-full bg-gray-300 py-2" type='submit' value='Create new revision'>
		</div>
	</form>
{/if}
