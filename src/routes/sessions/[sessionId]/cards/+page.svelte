<script lang="ts">
	import {Menu, MenuButton, MenuItem, MenuItems,} from "@rgossiaux/svelte-headlessui";
	import CardList from "./CardList.svelte";

	export let data

	let search = ""
	let cardList: HTMLElement
	let menu
	let currentCategory: string = null

	$: cards = data.decks.flatMap(deck => deck.cards)
		.filter(card => !card.id.startsWith('back:'))
		.filter(card => !currentCategory || currentCategory === card.category)
		.filter(card => search == null || card.name.toLowerCase().indexOf(search.toLowerCase()) >= 0)
	$: categories = data.decks.flatMap(deck => deck.cards)
		.map(card => card.category)
		.filter(value => value)
		.filter((value, index, array) => array.indexOf(value) === index)

	$: console.log(cards)

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

<div class="flex flex-col h-screen w-screen" style="height: 100svh">
	{#if data.decks}
		<CardList cards={cards}></CardList>
		<div class="flex p-2 gap-2">
			<input class="flex-1" type="text" placeholder="Search" bind:value={search}/>
			{#if categories.length > 1}
				<!--				<button class="button" on:click={() => menu.setOpen(true)}-->
				<!--				        style="height: 2.5rem; width: 2.5rem; line-height: inherit; padding: 0.25rem; min-width: inherit">-->
				<!--				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960">-->
				<!--					<path d="M400 816v-60h160v60H400ZM240 606v-60h480v60H240ZM120 396v-60h720v60H120Z"/>-->
				<!--				</svg>-->
				<!--				</button>-->
				<Menu class="relative">
					<MenuButton class="button button-slim h-10 w-10">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960">
							<path d="M400 816v-60h160v60H400ZM240 606v-60h480v60H240ZM120 396v-60h720v60H120Z"/>
						</svg>
					</MenuButton>
					<MenuItems
							class="absolute bottom-0 right-0 bg-white rounded drop-shadow p-1 flex flex-col items-stretch">
						<MenuItem let:active on:click={() => currentCategory=null}>
							<a class="flex items-center transition-colors duration-300 rounded px-2 py-1"
							   class:bg-blue-300={!currentCategory}>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960" class="w-4 h-4 mr-2"
								     class:opacity-0={currentCategory}>
									<path d="M378 810 154 586l43-43 181 181 384-384 43 43-427 427Z"/>
								</svg>
								All
							</a>
						</MenuItem>
						{#each categories as category}
							<MenuItem let:active on:click={() => currentCategory=category}>
								<a class="flex items-center transition-colors duration-300 rounded px-2 py-1"
								   class:bg-blue-300={currentCategory === category} class:border-blue-400={active}>
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960" class="w-4 h-4 mr-2"
									     class:opacity-0={currentCategory !== category}>
										<path d="M378 810 154 586l43-43 181 181 384-384 43 43-427 427Z"/>
									</svg>
									{category}
								</a>
							</MenuItem>
						{/each}
					</MenuItems>
				</Menu>
			{/if}
		</div>
	{/if}
</div>