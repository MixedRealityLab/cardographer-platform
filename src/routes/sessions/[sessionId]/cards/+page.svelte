<script lang="ts">
	import CardList from "./CardList.svelte";

	export let data

	let search = ""
	let cardList: HTMLElement
	let currentCategory: string = ''

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

<div class="flex flex-col h-screen w-screen">
	{#if data.decks}
		<CardList cards={cards}></CardList>
		<div class="flex p-2 gap-2">
			<input class="flex-1" type="text" placeholder="Search" bind:value={search}/>
			{#if categories.length > 1}
				<select bind:value={currentCategory}>
					<option value=''>All</option>
					{#each categories as category}
						<option value={category}>{category}</option>
					{/each}
				</select>
			{/if}
		</div>
	{/if}
</div>