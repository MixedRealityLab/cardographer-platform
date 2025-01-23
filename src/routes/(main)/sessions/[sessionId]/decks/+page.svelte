<script lang="ts">
	import {enhance} from "$app/forms"
	import SessionHeader from "../SessionHeader.svelte";
	import {formatDate} from "$lib/ui/formatutils";

	export let data

	let error = ''
</script>

<style>
    .border-highlight {
        @apply border-blue-700;
    }
</style>


<SessionHeader session={data.session} />

{#if data.decks}
	<!-- TODO SHow deck owner ( + credits?) -->
	<form class="w-full flex flex-col text-sm font-medium p-6 gap-4" method="post" use:enhance>
		{#each data.decks as deck}
			<label class:border-highlight={deck.selected} class="listItem items-center">
				<input type="checkbox" name="decks" value={deck.revisions[deck.index]._id} class="form-checkbox mr-4" bind:checked="{deck.selected}">
				<div class="flex flex-1 flex-col">
					<div class="flex">
						<div class="flex-1 flex items-center gap-1">
							<span class="font-semibold">{deck.revisions[deck.index].deckName}</span>
							{#if deck.revisions.length > 1}
								<button on:click|preventDefault={() => {deck.index--}} disabled={deck.index === 0} aria-label="Previous Revision"
								        class="disabled:opacity-10 transition-colors transition-opacity duration-500 text-gray-800 hover:text-blue-700 disabled:cursor-default">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
									     fill="currentColor">
										<path fill-rule="evenodd"
										      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
										      clip-rule="evenodd"/>
									</svg>
								</button>
								<span class="text-gray-600 font-semibold">v{deck.revisions[deck.index].revision}</span>
								<button on:click|preventDefault={() => {deck.index++}} aria-label="Next Revision"
								        class="disabled:opacity-10 transition-all duration-500 text-gray-800 hover:text-blue-700 disabled:cursor-default"
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
						<div class="text-xs text-gray-600">by {deck.revisions[deck.index].deckCredits}</div>
					</div>

					<div class="flex">
						<div class="flex-1">
							<div class="text-sm font-light">{deck.revisions[deck.index].deckDescription || ''}</div>
							<div class="text-sm font-light">{deck.revisions[deck.index].revisionDescription || ''}</div>
						</div>
						<div class="text-xs font-light text-gray-600">{formatDate(deck.revisions[deck.index].created)}</div>
					</div>
				</div>
			</label>
		{/each}

		{#if error}
			<div class="message-error">{error}</div>
		{/if}

		<button class="button">Save</button>
	</form>
{/if}