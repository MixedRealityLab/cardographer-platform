<script lang="ts">
	import {base} from "$app/paths";
	import AppBar from '$lib/ui/AppBar.svelte'
	import type {PageData} from './$types'
	import {formatDate} from "$lib/ui/formatutils";

	let error: string

	export let data: PageData
</script>

<AppBar back="{base}/decks" subtitle="Deck">
	<div slot="subheader">Create Deck</div>
</AppBar>

<div class="w-full flex flex-col text-sm font-medium p-6 gap-4">


{#if !data.localUser?.isDeckBuilder}
	<div class="message-error">Sorry, you do not have Deck Builder rights - 
	please ask an administrator if you need to change this.</div>
{:else if data.usageDecks >= data.quotaDecks}
	<div class="message-error">Sorry, you have reached your deck quota ({data.usageDecks}/{data.quotaDecks}) - 
	please ask an administrator if you need to change this.</div>
{:else if data.usageRevisions >= data.quotaRevisions}
	<div class="message-error">Sorry, you have reached your deck revision quota ({data.usageRevisions}/{data.quotaRevisions}) - 
	please ask an administrator if you need to change this.</div>
{:else if data.usageDiskSizeK >= data.quotaDiskSizeK}
	<div class="message-error">Sorry, you have reached your disk quota ({data.usageDiskSizeK}/{data.quotaDiskSizeK}) - 
	please ask an administrator if you need to change this.</div>

{:else}

	{#if error}
		<div class="message-error">{error}</div>
	{/if}
	<form method="post">
		<input type="hidden" name="id" value="blank">
		<button class="listItem items-center">
			<img src="{base}/icons/deck.svg" class="w-6 mr-4" alt=""/>
			<div>Create Blank Deck</div>
		</button>
	</form>

	{#each data.revisions as revision}
		<form method="post">
			<input type="hidden" name="id" value="{revision._id}">
			<button class="listItem items-center">
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
						<div class="flex-1 flex">
							{#if revision.diskSizeK}
							<span class="text-gray-600 pr-1">({revision.diskSizeK} KB)</span>
							{/if}
							<div class="text-sm font-light">{revision.deckDescription || ''}</div>
							<div class="text-sm font-light">{revision.revisionDescription || ''}</div>
						</div>
						<div class="text-xs font-light">{formatDate(revision.created)}</div>
					</div>
				</div>
			</button>
		</form>
	{/each}

{/if}

</div>

