<!--suppress JSUnusedAssignment -->
<script lang="ts">
	import {base} from "$app/paths";
	import type {CardInfo} from "$lib/types";
	import {afterUpdate} from "svelte";

	//const base = 'https://cardographer.cs.nott.ac.uk'

	export let widthRatio = 2
	export let heightRatio = 3

	export let cards: CardInfo[]

	let currentCard: CardInfo
	let cardIndex: number

	let cardList: HTMLElement
	let clientWidth: number
	let clientHeight: number
	let highlight: number = -1

	let contentHeight = clientHeight
	let contentWidth = clientWidth

	let aspectSet = false

	$: {
		if (clientWidth) {
			if (clientWidth / clientHeight > widthRatio / heightRatio) {
				contentHeight = Math.min(clientHeight, clientWidth * (heightRatio / widthRatio));
				contentWidth = Math.min(clientWidth, contentHeight * (widthRatio / heightRatio));
			} else {
				contentWidth = Math.min(clientWidth, clientHeight * (widthRatio / heightRatio));
				contentHeight = Math.min(clientHeight, contentWidth * (heightRatio / widthRatio));
			}
		}
	}

	afterUpdate(() => {
		if (!aspectSet) {
			const firstCard = cards.find((card) => card.frontUrl)
			if (firstCard) {
				const img = new Image()
				img.onload = () => {
					widthRatio = img.naturalWidth
					heightRatio = img.naturalHeight
					aspectSet = true
				}
				img.onerror = () => {
					firstCard.frontUrl = null
				}
				img.src = firstCard.frontUrl.startsWith('/') ? base + firstCard.frontUrl : firstCard.frontUrl
			}
		}

		if (currentCard) {
			const index = cards.indexOf(currentCard)
			if (index !== -1) {
				scrollTo(index, false)
			} else {
				scrollTo(0, false)
			}
			currentCard = null
		}
	})

	export function scrollTo(target: number, smooth: boolean = true, select: boolean = false) {
		if (select) {
			highlight = target
		} else {
			highlight = -1
		}
		const center = target * contentWidth + (contentWidth / 2)
		const targetLeft = center - (clientWidth / 2)
		const behaviour: ScrollBehavior = smooth ? 'smooth' : 'auto'
		cardList.scrollTo({
			top: 0,
			left: targetLeft,
			behavior: behaviour
		})
		updateCurrentCardIndex(target)
	}

	export function updateCurrentCardIndex(newIndex: number = null) {
		if(newIndex == null)
		{
			newIndex = currentCardIndex()
		}
		if (cardIndex != newIndex) {
			cardIndex = newIndex
		}
	}

	export function updateCurrentCard() {
		updateCurrentCardIndex()
		currentCard = cards[currentCardIndex()]
	}

	function currentCardIndex(): number {
		return Math.floor((cardList.scrollLeft + (clientWidth / 2)) / contentWidth)
	}

	function handleScrollClick(event: MouseEvent) {
		const fraction = event.clientX / clientWidth
		const page = currentCardIndex()
		if (fraction > 0.7) {
			scrollTo(page + 1)
		} else if (fraction < 0.3) {
			scrollTo(page - 1)
		}
	}

	function pluralize(count: number, noun: string, suffix = 's') {
		return `${count} ${noun}${count !== 1 ? suffix : ''}`;
	}
</script>

<style>
	@keyframes highlight {
		0% {
			outline: 2px ridge #24F8;
		}
		50% {
			outline: 2px ridge #24F8;
		}
		100% {
			outline: 2px ridge #24F0;
		}
	}

	.highlight {
		animation: highlight 10s;
	}

	ol::-webkit-scrollbar {
		@apply h-2;
	}

	ol::-webkit-scrollbar-thumb {
		@apply rounded bg-gray-400 hover:bg-blue-500 transition-colors duration-300;
	}
</style>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!--suppress XmlInvalidId -->
<ol role="list" tabindex="0" aria-activedescendant="card{cardIndex}" aria-live="polite"
    aria-label="{pluralize(cards.length, 'Card')}"
    bind:clientWidth bind:this={cardList} bind:clientHeight
    class="flex-1 snap-x snap-mandatory flex overflow-x-scroll overflow-y-hidden"
    on:click={handleScrollClick} on:scroll={() => updateCurrentCardIndex()}>
	{#each cards as card, index}
		<li class="snap-center flex justify-center items-center" class:ml-auto={index === 0}
		    class:mr-auto={index === (cards.length - 1)}>
			<div style="width: {contentWidth}px; height: {contentHeight}px; padding: {contentHeight * 0.075}px {contentWidth * 0.075}px;">
				{#if card.frontUrl}
					<div class="w-full h-full bg-white drop-shadow bg-origin-content bg-center bg-contain bg-no-repeat"
					     class:highlight={index === highlight}
					     style="background-image: url({card.frontUrl.startsWith('/') ? base + card.frontUrl : card.frontUrl}); border-radius: {contentHeight * 0.05}px;"
					     id="card{index}"
					     role="img" aria-describedby="desc{index}" aria-label="{card.name}">
						<div class="hidden" id="desc{index}">{card.description}</div>
					</div>
				{:else}
					<div class="rounded-3xl w-full h-full bg-white p-6 overflow-clip flex flex-col justify-end drop-shadow gap-4"
					     class:highlight={index === highlight}>
						<h2 class="text-2xl text-center">{card.name}</h2>
						<p class="text-sm max-h-[50%] overflow-hidden" style="block-ellipsis: auto">{card.content || card.description}</p>
						<p>{card.category}</p>
					</div>
				{/if}
			</div>
		</li>
	{/each}
</ol>