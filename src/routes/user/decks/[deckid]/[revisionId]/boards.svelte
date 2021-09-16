<script context="module" lang="ts">
	import {base} from '$lib/paths'
	import type {LoadInput, LoadOutput} from '@sveltejs/kit'

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const token = session.user?.token;
		if (!token) {
			console.log(`note, no user token`, session);
			return {
				props: {revisions: []}
			}
		}
		const {deckId, revisionId} = page.params;
		const url = `${base}/api/user/decks/${deckId}/revisions/${revisionId}.json`;
		const res = await fetch(url, {
			headers: {authorization: `Bearer ${token}`}
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
	import type {CardDeckRevision} from "$lib/types";
	import AppBar from "$lib/ui/AppBar.svelte";
	import CardExportForm from "$lib/ui/CardExportForm.svelte";
	import CardUploadForm from "$lib/ui/CardUploadForm.svelte";
	import DeckTabs from "$lib/ui/DeckTabs.svelte";
	import {page} from "$app/stores";
	import ExpandableSection from "$lib/ui/ExpandableSection.svelte";

	export let revision: CardDeckRevision

</script>

<AppBar title="Cardographer" backpage="{base}/user/decks"/>
<DeckTabs page="boards" root="{base}/user/decks/{$page.params.deckId}/{$page.params.revisionId}"/>

<div class="p-4">
	{#each revision.boards as board}
		<ExpandableSection>
			<div slot="title">
				{board.name} <span class="text-gray-400">v{board.revision}</span>
			</div>
			<div>
				<div>
					Type: {board.category}
				</div>
				{#if board.description}
					<div>{board.description}</div>
				{/if}
				{#if board.content}
					<div>{board.content}</div>
				{/if}
			</div>

		</ExpandableSection>
	{/each}

	<div class="flex justify-center">
		<CardUploadForm revision="{revision}"/>

		<CardExportForm revision="{revision}"/>
	</div>
</div>