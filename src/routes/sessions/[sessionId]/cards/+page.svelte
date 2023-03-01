<!--suppress JSUnusedAssignment -->
<script lang="ts">
	import type {Session} from "$lib/types";
	import {Menu, MenuButton, MenuItem, MenuItems,} from "@rgossiaux/svelte-headlessui";
	import CardList from "./CardList.svelte";

	export let data: Session

	let cardList: CardList
	let search = ""
	let currentCategory: string = null

	$: cards = data.decks.flatMap(deck => deck['cards'])
		.filter(card => !card.id.startsWith('back:'))
		.filter(card => !currentCategory || currentCategory === card.category)
		.filter(card => search == null || card.name.toLowerCase().indexOf(search.toLowerCase()) >= 0)
	$: categories = data.decks.flatMap(deck => deck['cards'])
		.map(card => card.category)
		.filter(value => value)
		.filter((value, index, array) => array.indexOf(value) === index)

	function randomCard() {
		const card = Math.floor(Math.random() * cards.length)
		cardList.scrollTo(card)
	}
</script>

<div class="flex flex-col h-screen w-screen" style="height: 100svh">
	{#if data.decks}
		<CardList cards={cards} bind:this={cardList}></CardList>
		<div class="flex p-3 gap-2 relative">
			<label class="flex-1 flex">
				<input class="flex-1" type="text" placeholder="Search" bind:value={search}/>
			</label>
			<button class="button button-tool" title="Random Card" on:click={randomCard}>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960" class="h-5 w-5">
					<path d="M300.118 806Q321 806 335.5 791.382q14.5-14.617 14.5-35.5Q350 735 335.382 720.5q-14.617-14.5-35.5-14.5Q279 706 264.5 720.618q-14.5 14.617-14.5 35.5Q250 777 264.618 791.5q14.617 14.5 35.5 14.5Zm0-360Q321 446 335.5 431.382q14.5-14.617 14.5-35.5Q350 375 335.382 360.5q-14.617-14.5-35.5-14.5Q279 346 264.5 360.618q-14.5 14.617-14.5 35.5Q250 417 264.618 431.5q14.617 14.5 35.5 14.5Zm180 180Q501 626 515.5 611.382q14.5-14.617 14.5-35.5Q530 555 515.382 540.5q-14.617-14.5-35.5-14.5Q459 526 444.5 540.618q-14.5 14.617-14.5 35.5Q430 597 444.618 611.5q14.617 14.5 35.5 14.5Zm180 180Q681 806 695.5 791.382q14.5-14.617 14.5-35.5Q710 735 695.382 720.5q-14.617-14.5-35.5-14.5Q639 706 624.5 720.618q-14.5 14.617-14.5 35.5Q610 777 624.618 791.5q14.617 14.5 35.5 14.5Zm0-360Q681 446 695.5 431.382q14.5-14.617 14.5-35.5Q710 375 695.382 360.5q-14.617-14.5-35.5-14.5Q639 346 624.5 360.618q-14.5 14.617-14.5 35.5Q610 417 624.618 431.5q14.617 14.5 35.5 14.5ZM180 936q-24 0-42-18t-18-42V276q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Zm0-60h600V276H180v600Zm0-600v600-600Z"/>
				</svg>
			</button>
			{#if categories.length > 1}
				<Menu>
					<MenuButton class="button button-tool" title="Open Category Filter Menu">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960" class="h-5 w-5">
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