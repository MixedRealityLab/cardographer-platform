<script lang="ts">
	import {base} from "$app/paths";
	import AppBar from '$lib/ui/AppBar.svelte'
	import type {PageServerData} from './$types'
	import {formatDate} from "$lib/ui/formatutils";

	let error: string

	export let data: PageServerData
</script>

<AppBar back="{base}/decks" subtitle="Deck">
	<div slot="subheader">Create Deck</div>
</AppBar>
<div class="w-full flex flex-col text-sm font-medium p-6 gap-4">
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
						<div class="flex-1">
							<div class="text-sm font-light">{revision.deckDescription || ''}</div>
							<div class="text-sm font-light">{revision.revisionDescription || ''}</div>
						</div>
						<div class="text-xs font-light">{formatDate(revision.created)}</div>
					</div>
				</div>
			</button>
		</form>
	{/each}
</div>