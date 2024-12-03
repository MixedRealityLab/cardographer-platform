<script lang="ts">
	import {enhance} from "$app/forms";
	import {base} from "$app/paths";
	import type {CardDeckRevision} from "$lib/types"
	import ExpandableSection from "$lib/ui/ExpandableSection.svelte"

	import UploadButton from "$lib/ui/UploadButton.svelte";
	import DeckHeader from "../DeckHeader.svelte";

	export let data
	let error = ''
	let message = ''
</script>

<DeckHeader deck={data.revision}/>

<div class="p-6 flex flex-col gap-2">
	{#each data.revision.cards as card}
		<ExpandableSection class="py-1">
			<div slot="title">
				<div class="flex items-center">
					<img src="{base}/icons/card.svg" class="w-5 mr-4" alt=""/>
					<span>{card.name}</span>
					<span class="text-gray-400 ml-1.5">v{card.revision}</span>
				</div>
			</div>
			<div>
				<div class="ml-9">
					<div class="flex">
						{#if card.frontUrl}
							<img src={card.frontUrl.startsWith('/') ? base + card.frontUrl : card.frontUrl} class="h-48"
							     alt="Card"/>
						{/if}
						<div>
							{#if card.description}
								<div class="text-sm">{card.description}</div>
							{/if}
							{#if card.content}
								<div>{card.content}</div>
							{/if}
							<div>
								Type: {card.category}
							</div>
						</div>
					</div>
				</div>
			</div>
		</ExpandableSection>
	{:else}
		<div class="self-center">No Cards</div>
	{/each}

	{#if error}
		<div class="message-error">{error}</div>
	{/if}
	{#if message}
		<div class="message-success">{message}</div>
	{/if}
	<div class="flex justify-center">
		{#if data.revision.isOwnedByUser}
			<form method="post" use:enhance enctype="multipart/form-data">
				<UploadButton class="button m-3" types=".csv,text/csv">
					<img alt="" class="w-3.5 mr-1" src="{base}/icons/upload.svg"/>Upload CSV
				</UploadButton>
			</form>
		{/if}
		{#if data.revision.cards.length > 0 && !data.localUser.isGuest}
			<a class="button m-3" href="cards.csv">
				<img src="{base}/icons/download.svg" alt="" class="w-3.5 mr-1"/>Download CSV
			</a>
		{/if}
	</div>
</div>