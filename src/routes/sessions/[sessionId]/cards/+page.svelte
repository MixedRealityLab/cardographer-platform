<script lang="ts">
	import {base} from "$app/paths";

	export let data

	let cardList: HTMLElement

	function clamp(value: number, min: number, max: number) {
		return Math.min(Math.max(value, min), max);
	}

	function handleScrollClick(event: MouseEvent) {
		const fraction = event.clientX / cardList.clientWidth
		const page = Math.round(cardList.scrollLeft / cardList.clientWidth)
		if (fraction > 0.7) {
			const target = page + 1
			const targetLeft = clamp(target * cardList.clientWidth, 0, cardList.scrollWidth - cardList.clientWidth)
			cardList.scrollTo({
				top: 0,
				left: targetLeft,
				behavior: "smooth"
			})
		} else if (fraction < 0.3) {
			const target = page - 1
			const targetLeft = clamp(target * cardList.clientWidth, 0, cardList.scrollWidth - cardList.clientWidth)
			cardList.scrollTo({
				top: 0,
				left: targetLeft,
				behavior: "smooth"
			})
		}
	}
</script>

{#if data.decks}
	<ol class="snap-x snap-mandatory flex overflow-x-scroll overflow-y-hidden bg-gray-200"
	    on:click={handleScrollClick} bind:this={cardList}>
		{#each data.decks as deck}
			{#each deck.cards as card}
				<li class="snap-center">
					<div class="w-screen h-screen relative" style="height: 100svh">
						<div class="inset-8 absolute rounded-3xl bg-white p-6 overflow-clip flex flex-col justify-center drop-shadow">
							<h2 class="text-2xl text-center">{card.name}</h2>
							<p class="text-center">{card.description}</p>
						</div>
						{#if card.frontUrl}
							<div class="inset-8 absolute rounded-3xl bg-origin-content bg-center bg-contain bg-white bg-no-repeat"
							     style="background-image: url({card.frontUrl.startsWith('/') ? base + card.frontUrl : card.frontUrl})"></div>
						{/if}
					</div>
				</li>
			{/each}
		{/each}
	</ol>
{/if}