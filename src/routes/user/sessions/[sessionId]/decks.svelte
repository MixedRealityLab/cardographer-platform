<script context="module" lang="ts">
	import {base} from '$lib/paths';
	import {CardDeckRevisionSummary, Session} from "$lib/types";
	import {authenticateRequest, errorResponses} from "$lib/ui/token";
	import type {LoadInput, LoadOutput} from '@sveltejs/kit';

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const requestInfo = authenticateRequest(session)
		const {sessionId} = page.params;
		const responses = await Promise.all([
			fetch(`${base}/api/user/sessions/${sessionId}`, requestInfo),
			fetch(`${base}/api/user/decks/revisions`, requestInfo)
		])

		if (responses.every((res) => res.ok)) {
			return {
				props: {
					session: await responses[0].json() as Session,
					decks: (await responses[1].json()).decks as CardDeckRevisionSummary[]
				}
			}
		}

		return errorResponses(responses)
	}
</script>

<script lang="ts">
	import SessionTabs from './_SessionTabs.svelte'
	import type {CardDeckRevisionSummary, Session} from '$lib/types.ts'
	import {page, session as pageSession} from '$app/stores'
	import {onMount} from 'svelte'

	export let session: Session
	export let decks: CardDeckRevisionSummary[]

	let working = false
	let error = ''
	let message = ''

	onMount(() => {
		console.log(session)
		console.log(decks)
		if (decks && session && session.decks) {
			decks.forEach((deck) => {
				deck.selected = session.decks.some((sessionDeck) => sessionDeck.deckId === deck.deckId && sessionDeck.revision === deck.revision)
			})
			decks = decks
			//console.log(`should be ${analysis.snapshots.length} selected`);
		}
	});

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

	// submit deck edit form
	async function handleSubmit() {
		message = ''
		error = ''
		working = true

		const {sessionId} = $page.params;
		const cards = decks.filter((deck) => deck.selected).map<string>((deck) => deck._id)
		console.log(`submit`, cards)
		const res = await fetch(`${base}/api/user/sessions/${sessionId}/decks`, authenticateRequest($pageSession, {
			method: 'PUT',
			headers: {'content-type': 'application/json'},
			body: JSON.stringify(cards)
		}));
		working = false;
		if (res.ok) {
			message = "Updated";
			session = await res.json()
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}
</script>

<SessionTabs session="{session}"/>

{#if decks}
	<div class="w-full flex flex-col text-sm font-medium p-6">
		{#each decks as deck}
			<label class:border-blue-400={deck.selected} class="listItem items-center">
				<input type="checkbox" class="form-checkbox mr-4" bind:checked="{deck.selected}">
				<div class="flex flex-1 flex-col">
					<div class="flex">
						<div class="flex-1" class:text-gray-500={!deck.selected}>{deck.deckName}
							<span>v{deck.revision} <span class="font-normal">{deck.revisionName || ''}</span></span></div>
						<div class="text-sm font-light">{formatDate(deck.created)}</div>
					</div>

					<div class="text-sm font-light">{deck.deckDescription || ''}</div>
					<div class="text-sm font-light">{deck.revisionDescription || ''}</div>
				</div>
			</label>
		{/each}

		{#if error}
			<div class="message-error">{error}</div>
		{/if}
		{#if message}
			<div class="message-success">{message}</div>
		{/if}

		<button disabled={working} class="button mt-4" on:click={handleSubmit}>Save</button>
	</div>
{/if}