<script context="module" lang="ts">
	import {base} from '$app/paths'
	import type {CardDeckRevisionSummary, Session} from "$lib/types";
	import {authenticateRequest, errorResponses} from "$lib/ui/token";
	import type {Load} from '@sveltejs/kit';

	interface DeckInfo {
		deckId: string
		revisions: CardDeckRevisionSummary[]
		index: number
		selected: boolean
	}

	export const load: Load = async function ({params, fetch, session}) {
		const requestInfo = authenticateRequest(session)
		const {sessionId} = params;
		const responses = await Promise.all([
			fetch(`${base}/api/user/sessions/${sessionId}`, requestInfo),
			fetch(`${base}/api/user/decks/revisions`, requestInfo)
		])

		if (responses.every((res) => res.ok)) {
			const decks = ((await responses[1].json()).decks as CardDeckRevisionSummary[]).sort(compareDecks)
			let deckInfo: DeckInfo[] = []
			decks.forEach((revision) => {
				const deck = deckInfo.find((deckItem) => deckItem.deckId == revision.deckId)
				if (!deck) {
					deckInfo.push({
						deckId: revision.deckId,
						revisions: [revision],
						index: -1,
						selected: false
					})
				} else {
					deck.revisions.push(revision)
				}
			})
			const sessionItem = await responses[0].json() as Session
			deckInfo.forEach((deckInfo) => {
				if (sessionItem.decks) {
					const sessionDeck = sessionItem.decks.find((sessionDeck) => sessionDeck.deckId == deckInfo.deckId)
					if (sessionDeck) {
						deckInfo.index = deckInfo.revisions.findIndex((revision) => revision.revision === sessionDeck.revision)
						deckInfo.selected = true
					}
				}
				if (deckInfo.index === -1) {
					deckInfo.index = deckInfo.revisions.length - 1
				}
			})
			return {
				props: {
					session: sessionItem,
					decks: deckInfo
				}
			}
		}

		return errorResponses(responses)
	}

	function compareDecks(a: CardDeckRevisionSummary, b: CardDeckRevisionSummary) {
		const aName = `${a.deckName} ${a.created}`;
		const bName = `${b.deckName} ${b.created}`;
		return String(aName).localeCompare(bName);
	}
</script>

<script lang="ts">
	import SessionTabs from './_SessionTabs.svelte'
	import {page, session as pageSession} from '$app/stores'

	export let session: Session
	export let decks: DeckInfo[]

	let working = false
	let error = ''
	let message = ''

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

	async function handleSubmit() {
		message = ''
		error = ''
		working = true

		const {sessionId} = $page.params;
		const cards = decks.filter((deck) => deck.selected).map<string>((deck) => deck.revisions[deck.index]._id)
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

<style>
    .border-highlight {
        @apply border-blue-700;
    }
</style>

<SessionTabs session="{session}"/>

{#if decks}
	<div class="w-full flex flex-col text-sm font-medium p-6 gap-4">
		{#each decks as deck}
			<label class:border-highlight={deck.selected} class="listItem items-center">
				<input type="checkbox" class="form-checkbox mr-4" bind:checked="{deck.selected}">
				<div class="flex flex-1 flex-col">
					<div class="flex">
						<div class="flex-1 flex items-center gap-1">
							<span class="font-semibold">{deck.revisions[deck.index].deckName}</span>
							{#if deck.revisions.length > 1}
								<button on:click|preventDefault={() => {deck.index--}} disabled={deck.index === 0}
								        class="disabled:opacity-10 transition-colors transition-opacity duration-500 text-gray-800 hover:text-blue-700 disabled:cursor-default">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
									     fill="currentColor">
										<path fill-rule="evenodd"
										      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
										      clip-rule="evenodd"/>
									</svg>
								</button>
								<span class="text-gray-600 font-semibold">v{deck.revisions[deck.index].revision}</span>
								<button on:click|preventDefault={() => {deck.index++}}
								        class="disabled:opacity-10 transition-colors transition-opacity duration-500 text-gray-800 hover:text-blue-700 disabled:cursor-default"
								        disabled={deck.index >= deck.revisions.length - 1}>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
									     fill="currentColor">
										<path fill-rule="evenodd"
										      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
										      clip-rule="evenodd"/>
									</svg>
								</button>
							{:else}
								<span class="text-gray-600 font-semibold">v{deck.revisions[deck.index].revision}</span>
							{/if}
							<span class="text-gray-600 font-normal">{deck.revisions[deck.index].revisionName || ''}</span>
						</div>
						<div class="text-sm font-light">{formatDate(deck.revisions[deck.index].created)}</div>
					</div>

					<div class="text-sm font-light">{deck.revisions[deck.index].deckDescription || ''}</div>
					<div class="text-sm font-light">{deck.revisions[deck.index].revisionDescription || ''}</div>
				</div>
			</label>
		{/each}

		{#if error}
			<div class="message-error">{error}</div>
		{/if}
		{#if message}
			<div class="message-success">{message}</div>
		{/if}

		<button disabled={working} class="button" on:click={handleSubmit}>Save</button>
	</div>
{/if}