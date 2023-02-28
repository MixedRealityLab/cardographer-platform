<script lang="ts">
	import {base} from "$app/paths";
	import type {CardInfo} from "$lib/types";

	export let widthRatio = 2;
	export let heightRatio = 3;

	export let cards: CardInfo[]

	let cardList: HTMLElement
	let clientWidth: number;
	let clientHeight: number;

	let contentWidth = 100;
	let contentHeight = 100;

	$: contentWidth = Math.min(clientWidth, clientHeight * (widthRatio / heightRatio));
	$: contentHeight = Math.min(clientHeight, clientWidth * (heightRatio / widthRatio));

	function clamp(value: number, min: number, max: number) {
		return Math.min(Math.max(value, min), max);
	}

	function handleScrollClick(event: MouseEvent) {
		const fraction = event.clientX / clientWidth
		const page = Math.floor((cardList.scrollLeft + (clientWidth / 2)) / contentWidth)
		console.log(page)
		if (fraction > 0.7) {
			const target = page + 1
			const center = target * contentWidth + (contentWidth / 2)
			const targetLeft = clamp(center - (clientWidth / 2), 0, cardList.scrollWidth - clientWidth)
			cardList.scrollTo({
				top: 0,
				left: targetLeft,
				behavior: "smooth"
			})
		} else if (fraction < 0.3) {
			const target = page - 1
			const center = target * contentWidth + (contentWidth / 2)
			const targetLeft = clamp(center - (clientWidth / 2), 0, cardList.scrollWidth - clientWidth)
			cardList.scrollTo({
				top: 0,
				left: targetLeft,
				behavior: "smooth"
			})
		}
	}
</script>

<ol bind:clientHeight
    bind:clientWidth bind:this={cardList} class="flex-1 snap-x snap-mandatory flex overflow-x-scroll overflow-y-hidden"
    on:click={handleScrollClick}>
	{#each cards as card}
		<li class="snap-center flex justify-center items-center">
			<div class="p-8" style="width: {contentWidth}px; height: {contentHeight}px">
				{#if card.frontUrl}
					<div class="rounded-3xl w-full h-full bg-white overflow-clip drop-shadow bg-origin-content bg-center bg-contain bg-no-repeat"
					     aria-description="{card.content}" aria-label="{card.name}"
					     style="background-image: url({card.frontUrl.startsWith('/') ? base + card.frontUrl : card.frontUrl})">
					</div>
				{:else}
					<div class="rounded-3xl w-full h-full bg-white p-6 overflow-clip flex flex-col justify-end drop-shadow">
						<h2 class="text-2xl text-center">{card.name}</h2>
						<p class="text-center py-16">{card.content}</p>
						<p>{card.category}</p>
					</div>
				{/if}
			</div>
		</li>
	{/each}
</ol>