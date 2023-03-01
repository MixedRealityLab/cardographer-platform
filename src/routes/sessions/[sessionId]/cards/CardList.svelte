<!--suppress JSUnusedAssignment -->
<script lang="ts">
	import {base} from "$app/paths";
	import type {CardInfo} from "$lib/types";
	import {onMount} from "svelte";

	export let widthRatio = 2;
	export let heightRatio = 3;

	export let cards: CardInfo[]

	let cardList: HTMLElement
	let clientWidth: number;
	let clientHeight: number;

	$: contentHeight = Math.min(clientHeight, clientWidth * (heightRatio / widthRatio));
	$: contentWidth = Math.min(clientWidth, contentHeight * (widthRatio / heightRatio));

	$: console.log(contentWidth, contentHeight)

	$: firstCard = cards.find((card) => card.frontUrl)
	$: if (firstCard) {
		onMount(async () => {
			const img = new Image()
			img.onload = function () {
				widthRatio = img.naturalWidth
				heightRatio = img.naturalHeight
				console.log(widthRatio, heightRatio, img)
			}
			img.src = firstCard.frontUrl.startsWith('/') ? base + firstCard.frontUrl : firstCard.frontUrl
			console.log(img.src)
		});
	}

	export function scrollTo(target: number) {
		const center = target * contentWidth + (contentWidth / 2)
		const targetLeft = center - (clientWidth / 2)
		cardList.scrollTo({
			top: 0,
			left: targetLeft,
			behavior: "smooth"
		})
	}

	function handleScrollClick(event: MouseEvent) {
		const fraction = event.clientX / clientWidth
		const page = Math.floor((cardList.scrollLeft + (clientWidth / 2)) / contentWidth)
		if (fraction > 0.7) {
			scrollTo(page + 1)
		} else if (fraction < 0.3) {
			scrollTo(page - 1)
		}
	}
</script>

<style>
    ol::-webkit-scrollbar {
        @apply h-2;
    }

    ol::-webkit-scrollbar-thumb {
        @apply rounded bg-gray-400 hover:bg-blue-500 transition-colors duration-300;
    }
</style>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<ol bind:clientHeight
    bind:clientWidth bind:this={cardList} class="flex-1 snap-x snap-mandatory flex overflow-x-scroll overflow-y-hidden"
    on:click={handleScrollClick}>
	{#each cards as card}
		<li class="snap-center flex justify-center items-center">
			<div class="p-8" style="width: {contentWidth}px; height: {contentHeight}px">
				{#if card.frontUrl}
					<div class="rounded-3xl w-full h-full bg-white overflow-clip drop-shadow bg-origin-content bg-center bg-contain bg-no-repeat"
					     aria-description="{card.content || card.description}" aria-label="{card.name}"
					     style="background-image: url({card.frontUrl.startsWith('/') ? base + card.frontUrl : card.frontUrl})">
					</div>
				{:else}
					<div class="rounded-3xl w-full h-full bg-white p-6 overflow-clip flex flex-col justify-end drop-shadow">
						<h2 class="text-2xl text-center">{card.name}</h2>
						<p class="text-center py-16">{card.content || card.description}</p>
						<p>{card.category}</p>
					</div>
				{/if}
			</div>
		</li>
	{/each}
</ol>