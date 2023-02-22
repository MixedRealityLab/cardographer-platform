<script lang="ts">
	export let data

	function handleScrollClick(event: MouseEvent) {
		console.log(event)
		event.clientX / event.target.clientWidth
	}
</script>

{#if data.decks}
	<div class="snap-x snap-mandatory flex overflow-x-scroll overflow-y-hidden bg-gray-200"
	     on:click={handleScrollClick}>
		{#each data.decks as deck}
			{#each deck.cards as card}
				<div class="snap-center">
					<div class="w-screen h-screen relative" style="height: 100svh">
						<div class="inset-8 absolute rounded-3xl bg-white p-6 overflow-clip flex flex-col justify-center drop-shadow">
							<div class="text-2xl">{card.name}</div>
							<div>{card.description}</div>
						</div>
						{#if card.frontUrl}
							<div class="inset-8 absolute rounded-3xl bg-origin-content bg-center bg-contain bg-white bg-no-repeat"
							     style="background-image: url({card.frontUrl})"></div>
						{/if}
					</div>
				</div>
			{/each}
		{/each}
	</div>
{/if}