<script context="module" lang="ts">
	import {base} from '$app/paths'
	import {authenticateRequest, errorResponse} from "$lib/ui/token";
	import type {Load} from "@sveltejs/kit";

	export const load: Load = async function ({fetch, session}) {
		const res = await fetch(`${base}/api/user/decks/templates`, authenticateRequest(session))
		if (res.ok) {
			return {
				props: {
					revisions: (await res.json()).values.sort(compareRevisions)
				}
			};
		}

		return errorResponse(res)
	}

	function compareRevisions(a, b) {
		const aName = `${a.deckName} ${('000' + a.revision).slice(-3)} ${a.revisionName}`;
		const bName = `${b.deckName} ${('000' + b.revision).slice(-3)} ${b.revisionName}`;
		return String(aName).localeCompare(bName);
	}
</script>

<script lang="ts">
	import AppBar from '$lib/ui/AppBar.svelte'
	import type {CardDeckRevisionSummary} from '$lib/types'
	import type {PostUserDecksResponse} from '$lib/apitypes'
	import {session} from '$app/stores'
	import {goto} from '$app/navigation'

	export let revisions: CardDeckRevisionSummary[]

	let working = false;
	let error = '';
	let message = '';

	async function createCopy(revisionId: string) {
		if (working) {
			return
		}
		error = message = ''
		working = true
		const res = await fetch(`${base}/api/user/decks/copy`, authenticateRequest($session, {
			method: 'post',
			body: revisionId
		}));
		if (res.ok) {
			const info = await res.json() as PostUserDecksResponse;
			// redirect
			goto(`${base}/user/decks/${info.deckId}/${info.revId}`);
		} else {
			error = res.statusText
		}
	}

	function formatDate(isoDate: string): string {
		const date = new Date(isoDate)
		const now = new Date()
		if (date.getFullYear() == now.getFullYear()) {
			return date.toLocaleTimeString('en-gb', {
				'hour': "numeric",
				'minute': '2-digit'
			}) + ', ' + date.toLocaleDateString('en-gb', {
				month: 'short',
				day: 'numeric'
			})
		} else {
			return date.toLocaleTimeString('en-gb', {
				'hour': "numeric",
				'minute': '2-digit'
			}) + ', ' + date.toLocaleDateString('en-gb', {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			})
		}
	}
</script>

<AppBar back="{base}/user/decks">
	<div slot="subheader">Create Deck</div>
</AppBar>
<div class="w-full flex flex-col text-sm font-medium p-6 gap-4">
	{#if error}
		<div class="message-error">{error}</div>
	{/if}
	<div on:click="{() => createCopy('blank')}" class="listItem items-center" class:cursor-pointer={!working}>
		<img src="{base}/icons/deck.svg" class="w-6 mr-4" alt=""/>
		<div>Create Blank Deck</div>
	</div>

	{#each revisions as revision}
		<div on:click="{() => createCopy(revision._id)}" class="listItem items-center"
		       class:cursor-pointer={!working}>
			<img src="{base}/icons/deck.svg" class="w-6 mr-4" alt=""/>
			<div class="flex flex-1 flex-col">
				<div class="flex">
					<div class="flex-1 flex items-center gap-1">
						<div>Create Copy of {revision.deckName}
							<span class="text-gray-400">v{revision.revision} <span
									class="font-normal">{revision.revisionName ? ' ' + revision.revisionName : ''}</span></span>
						</div>
						{#if revision.isPublic}
							<div class="chip">Public</div>
						{/if}
					</div>
					<div class="text-xs font-light">by {revision.deckCredits}</div>
				</div>

				<div class="flex">
					<div class="flex-1">
						<div class="text-sm font-light">{revision.deckDescription || ''}</div>
						<div class="text-sm font-light">{revision.revisionDescription || ''}</div>
					</div>
					<div class="text-xs font-light">{formatDate(revision.created)}</div>
				</div>
			</div>
		</div>
	{/each}
</div>