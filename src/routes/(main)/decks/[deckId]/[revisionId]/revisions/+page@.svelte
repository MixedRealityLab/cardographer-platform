<script lang="ts">
	import {goto} from "$app/navigation"
	import {base} from "$app/paths"
	import {page} from "$app/stores"
	import AppBar from '$lib/ui/AppBar.svelte'
	import ConfirmDialog from "$lib/ui/ConfirmDialog.svelte"
    import { invalidateAll } from '$app/navigation';
	import type {PageData} from './$types'

	export let data: PageData


	async function deleteDeck() {
		const {deckId} = $page.params;
		const res = await fetch(`${base}/decks/${deckId}`, {
			method: 'DELETE'
		})
		if (res.ok) {
			await goto(`${base}/decks`);
		}
	}
	async function deleteRevision(revisionId) {
		const {deckId} = $page.params;
		const res = await fetch(`${base}/decks/${deckId}/${revisionId}`, {
			method: 'DELETE'
		})
		if (res.ok) {
			invalidateAll()
			if (data.revisions[data.revisions.length-1].revision == revisionId)
				await goto(`${base}/decks/${deckId}/${data.revisions[data.revisions.length-2].revision}/revisions`);
			else
				await goto(`${base}/decks/${deckId}/${data.revisions[data.revisions.length-1].revision}/revisions`);
		}
	}

</script>

<style>
    .border-highlight {
        @apply border-blue-200 hover:border-blue-400;
    }
</style>

<AppBar back="{base}/decks/{data.selectedRevision.deckId}/{data.selectedRevision.revision}">
	<div slot="subheader">
		Select Revision
	</div>
</AppBar>

<div class="w-full flex flex-col mb-4 text-sm font-medium p-6 gap-4">
	{#each data.revisions as revision}
		<a class:border-highlight={revision.revision === data.selectedRevision.revision} class="listItem items-center"
		   href="{base}/decks/{revision.deckId}/{revision.revision}">
			<img src="{base}/icons/deck.svg" class="w-6 mr-4" alt=""/>
			<div class="flex-col flex flex-1">
				<div>{revision.deckName}
					<span class="text-gray-600">v{revision.revision}</span> <span
							class="font-normal">{revision.revisionName ? ' ' + revision.revisionName : ''}</span>
				</div>
				<div class="flex flex-row gap-1">
				    {#if revision.diskSizeK}
					<span class="text-gray-600">({revision.diskSizeK} KB)</span>
					{/if}
					{#if !revision.isUsable}
						<div class="chip">Don't Use</div>
					{/if}
					{#if revision.isLocked}
						<div class="chip">Locked</div>
					{/if}
					{#if revision.isPublic}
						<div class="chip">Public</div>
					{/if}
					{#if revision.isTemplate}
						<div class="chip">Template</div>
					{/if}
				</div>
				{#if revision.revisionDescription}
					<div class="text-sm font-light">{revision.revisionDescription}</div>
				{/if}
			</div>
			{#if data.revisions.length > 1}
			<ConfirmDialog
					cancelTitle="Cancel"
					confirmTitle="Delete Revision"
					let:confirm="{confirmThis}"
					title="Delete {data.selectedRevision.deckName} v{revision.revision}?">
				<button class="button-delete button" on:click|preventDefault={() => confirmThis(()=>deleteRevision(revision.revision))}>
					<img alt="" class="w-4 mr-1" src="{base}/icons/delete.svg"/>
				</button>
			</ConfirmDialog>
			{/if}
		</a>
	{/each}

	{#if data.usageRevisions >= data.quotaRevisions}
		<div class="message-error">Sorry, you have reached your deck revision quota ({data.usageRevisions}/{data.quotaRevisions}) - 
		please ask an administrator if you need to change this.</div>
	{:else if data.usageDiskSizeK >= data.quotaDiskSizeK}
		<div class="message-error">Sorry, you have reached your disk quota ({data.usageDiskSizeK}/{data.quotaDiskSizeK}) - 
		please ask an administrator if you need to change this.</div>
	{:else if data.revisions.length > 0 && data.revisions[data.revisions.length-1].diskSizeK && data.usageDiskSizeK + data.revisions[data.revisions.length-1].diskSizeK > data.quotaDiskSizeK }
		<div class="message-error">Warning, this would tak you over your disk quota ({data.usageDiskSizeK}+{data.revisions[data.revisions.length-1].diskSizeK}/{data.quotaDiskSizeK}) - 
		please ask an administrator if you need to change this.</div>
	{/if}

	<div class="flex justify-center">
		<ConfirmDialog
				cancelTitle="Cancel"
				confirmTitle="Delete"
				let:confirm="{confirmThis}"
				title="Delete {data.selectedRevision.deckName}?">
			<button class="button-delete button m-2" on:click={() => confirmThis(deleteDeck)}>
				<img alt="" class="w-4 mr-1" src="{base}/icons/delete.svg"/>Delete Deck
			</button>
		</ConfirmDialog>
		{#if data.localUser?.isDeckBuilder && data.usageRevisions < data.quotaRevisions && data.usageDiskSizeK < data.quotaDiskSizeK }
		<form method="post">
			<button class="button m-2">
				<img alt="" class="w-4 mr-1" src="{base}/icons/add.svg"/>New Revision
			</button>
		</form>
		{/if}
	</div>
</div>