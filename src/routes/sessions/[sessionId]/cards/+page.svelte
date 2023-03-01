<script lang="ts">
	import {Menu, MenuButton, MenuItem, MenuItems,} from "@rgossiaux/svelte-headlessui";
	import CardList from "./CardList.svelte";

	export let data

	let search = ""
	let currentCategory: string = null

	$: cards = data.decks.flatMap(deck => deck.cards)
		.filter(card => !card.id.startsWith('back:'))
		.filter(card => !currentCategory || currentCategory === card.category)
		.filter(card => search == null || card.name.toLowerCase().indexOf(search.toLowerCase()) >= 0)
	$: categories = data.decks.flatMap(deck => deck.cards)
		.map(card => card.category)
		.filter(value => value)
		.filter((value, index, array) => array.indexOf(value) === index)
</script>

<div class="flex flex-col h-screen w-screen" style="height: 100svh">
	{#if data.decks}
		<CardList cards={cards}></CardList>
		<div class="flex p-3 gap-2 relative">
			<input class="flex-1" type="text" placeholder="Search" bind:value={search}/>
			{#if categories.length > 1}
				<Menu>
					<MenuButton class="button button-slim h-10 w-10">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960">
							<path d="M400 816v-60h160v60H400ZM240 606v-60h480v60H240ZM120 396v-60h720v60H120Z"/>
						</svg>
					</MenuButton>
					<MenuItems
							class="absolute bottom-14 right-3 bg-white rounded drop-shadow p-1 flex flex-col items-stretch"
							style="max-width: 70svw">
						<MenuItem let:active on:click={() => currentCategory=null}>
							<div class="flex items-center transition-colors duration-300 rounded px-2 py-1 cursor-pointer hover:bg-blue-200"
							     class:bg-blue-300={!currentCategory}>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960" class="w-5 h-5 mr-2"
								     class:opacity-0={currentCategory}>
									<path d="M378 810 154 586l43-43 181 181 384-384 43 43-427 427Z"/>
								</svg>
								<span class="flex-1">All</span>
							</div>
						</MenuItem>
						{#each categories as category}
							<MenuItem let:active on:click={() => currentCategory=category}>
								<div class="flex items-center transition-colors duration-300 rounded px-2 py-1 cursor-pointer hover:bg-blue-200"
								     class:bg-blue-300={currentCategory === category} class:border-blue-400={active}>
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960" class="w-5 h-5 mr-2"
									     class:opacity-0={currentCategory !== category}>
										<path d="M378 810 154 586l43-43 181 181 384-384 43 43-427 427Z"/>
									</svg>
									<span class="flex-1">{category}</span>
								</div>
							</MenuItem>
						{/each}
					</MenuItems>
				</Menu>
			{/if}
		</div>
	{/if}
</div>