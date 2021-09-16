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
	import AppBar from '$lib/ui/AppBar.svelte';
	import type {CardDeckRevision} from '$lib/types';
	import {page} from '$app/stores';
	import ExpandableSection from "$lib/ui/ExpandableSection.svelte";
	import RevisionEditForm from '$lib/ui/RevisionEditForm.svelte';
	import CardUploadForm from '$lib/ui/CardUploadForm.svelte';
	import CardExportForm from '$lib/ui/CardExportForm.svelte';
	import RevisionBuildForm from '$lib/ui/RevisionBuildForm.svelte';
	import NewRevisionForm from '$lib/ui/NewRevisionForm.svelte';
	import {onMount} from 'svelte';

	export let revision: CardDeckRevision;

	onMount(() => {
		console.log(`onMount revision`);
	});
</script>
<!-- ?? .. problem - ${base}/user/decks/{$page.params.deckId}/revisions/{$page.params.revId} -->
<AppBar title="Cardographer" backpage="{base}/user/decks/{$page.params.deckId}"/>
<!-- <UserTabs/> -->

{#if revision}
	<div class="px-2 py-2">
		<div>{revision.deckName} (rev.{revision.revision}{revision.revisionName ? ' ' + revision.revisionName : ''})
		</div>
	</div>
{/if}
<div class="w-full mb-4 text-sm font-medium py-2">
	<ExpandableSection title="Deck" expanded="true">
		<RevisionEditForm revision="{revision}"/>
	</ExpandableSection>

	<ExpandableSection title="Cards">
		<CardUploadForm revision="{revision}"/>

		<CardExportForm revision="{revision}"/>
	</ExpandableSection>

	<div class="px-2 py-2 border">
		<a class="w-full" href="{revision.revision}/files">
			<span>Files...</span>
		</a>
	</div>

	<ExpandableSection title="Build">
		<RevisionBuildForm revision="{revision}"/>
	</ExpandableSection>

	{#if revision.isCurrent}
		<ExpandableSection title="New Revision">
			<NewRevisionForm revision="{revision}"/>
		</ExpandableSection>
	{/if}

	<ExpandableSection title="Testing">
		<a class="w-full"
		   href="{base}/api/client/decks/{$page.params.deckId}/revisions/{$page.params.revId}/deckInfo.json"
		   target="_blank">
			<span>Unity deck info file</span>
		</a>
	</ExpandableSection>
</div>