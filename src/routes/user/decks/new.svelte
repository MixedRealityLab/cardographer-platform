<script context="module" lang="ts">
	import {base} from '$lib/paths';
	import type {LoadOutput} from '@sveltejs/kit';

	export async function load({fetch, session}): Promise<LoadOutput> {
		const token = session.user?.token;
		if (!token) {
			console.log(`note, no user token`, session);
			return {
				props: {decks: []}
			}
		}
		const url = `${base}/api/public/templates.json`;
		const res = await fetch(url, {});

		if (res.ok) {
			return {
				props: {
					// sort by name
					revisions: (await res.json()).values.sort(compareRevisions)
				}
			};
		}

		return {
			status: res.status,
			error: new Error(`Could not load ${url}`)
		};
	}

	function compareRevisions(a, b) {
		const aName = `${a.deckName} ${('000' + a.revision).slice(-3)} ${a.revisionName}`;
		const bName = `${b.deckName} ${('000' + b.revision).slice(-3)} ${b.revisionName}`;
		return String(aName).localeCompare(bName);
	}
</script>

<script lang="ts">
	import AppBar from '$lib/ui/AppBar.svelte'
	import type {CardDeckRevision, CardDeckRevisionSummary} from '$lib/types'
	import type {PostUserDecksResponse} from '$lib/apitypes'
	import {session} from '$app/stores'
	import {goto} from '$app/navigation'

	export let revisions: CardDeckRevisionSummary[]

	let working = false;
	let error = '';
	let message = '';

	async function uploadTemplate(template: CardDeckRevision) {
		const token = $session.user?.token;
		const postResult = await fetch(`${base}/api/user/decks`, {
			method: 'POST',
			headers: {
				authorization: `Bearer ${token}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify(template)
		});
		working = false;
		if (postResult.ok) {
			message = "Created";
			const info = await postResult.json() as PostUserDecksResponse;
			// redirect
			goto(`${base}/user/decks/${info.deckId}/${info.revId}`);
			console.log(`created`, info);
		} else {
			error = `Sorry, there was a problem (${postResult.statusText})`;
		}
	}

	async function createBlank() {
		if (working) {
			return
		}
		error = message = '';
		working = true;
		const timestamp = new Date().toISOString()
		await uploadTemplate({
			_id: "",
			cardCount: 0,
			created: timestamp,
			deckId: "",
			deckName: "New Deck",
			deckDescription: "A Blank Deck",
			slug: "",
			isLocked: false,
			isPublic: false,
			isTemplate: false,
			isUsable: false,
			lastModified: timestamp,
			revision: 0,
			boards: [],
			cards: [],
			defaults: undefined,
			propertyDefs: []
		})
	}

	async function createCopy(revision: CardDeckRevisionSummary) {
		if (working) {
			return
		}
		error = message = '';
		working = true;
		// get full revision
		const revisionResult = await fetch(`${base}/api/public/decks/${revision.deckId}/revisions/${revision.revision}.json`);
		if (!revisionResult.ok) {
			error = `Sorry, there was a problem getting the template (${revisionResult.statusText})`;
			working = false;
			return;
		}
		const template = await revisionResult.json() as CardDeckRevision;
		template.revisionDescription = `Copy of ${template.deckName} revision ${template.revision} (${template.revisionName})`
		template.deckName = 'New deck';
		template.slug = '';
		await uploadTemplate(template)
	}
</script>

<AppBar back="{base}/user/decks"/>
<div class="w-full bg-gray-100 font-semibold px-4 py-1">Create Deck</div>
<div class="w-full grid grid-cols-1 gap-1 mb-4 text-sm font-medium p-4">
	<div on:click="{() => createBlank()}" class="listItem flex-col"
	     class:cursor-pointer={!working}>
		<div class="flex flex-row gap-1">
			<div>Create Blank Deck</div>
		</div>
	</div>

	{#each revisions as revision}
		<div on:click="{() => createCopy(revision)}"
		     class="listItem flex-col" class:cursor-pointer={!working}>
			<div class="flex flex-row gap-1">
				<div>Create Copy of {revision.deckName}
					({revision.revisionName ? revision.revisionName : revision.revision})
				</div>
				{#if !revision.isUsable}
					<div class="px-1 rounded-md bg-gray-200">Don't use</div>
				{/if}
				{#if revision.isPublic}
					<div class="px-1 rounded-md bg-gray-200">Public</div>
				{/if}
			</div>
			<div class="text-sm font-light">{revision.revisionDescription}</div>
		</div>
	{/each}
</div>