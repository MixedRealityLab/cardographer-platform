<!--suppress HtmlUnknownTag -->
<script lang="ts" context="module">
	import type {Miro} from "@mirohq/websdk-types"

	declare const miro: Miro
</script>

<script lang="ts">
	import {enhance} from "$app/forms";
	import {base} from "$app/paths"
	import type {CardDeckRevision, CardInfo} from "$lib/types"
	import ExpandableSection from "$lib/ui/ExpandableSection.svelte"
	import LoginPanel from "$lib/ui/LoginPanel.svelte"
	import type {ActionData} from "./$types"
	import {invalidateAll} from '$app/navigation'

	import type {BoardNode} from "@mirohq/websdk-types"
	import {onMount} from "svelte"
	import LiveView from "$lib/ui/LiveView.svelte"
	import type {PageData} from './$types'

	export let data: PageData
	export let form: ActionData
	let selectedCards: string[] = []
	let widgets: BoardNode[] = []
	let error: string
	let success: boolean = false
	let description: string = ''

	onMount(async () => {
		await miro.board.ui.on('selection:update', updateWidgets)
		await updateWidgets()
	})

	async function updateWidgets() {
		try {
			const allWidgets = await miro.board.get()
			const images = allWidgets.filter((widget) => widget.type === 'image').length
			if (images === 0) {
				widgets = []
				//warning = "No cards found on board"
				//allowUpload = false
			} else {
				widgets = allWidgets.filter((widget) => widget.type === 'image' && widget.url === '' && widget.title === '')
				//warning = null
				//allowUpload = true
			}

			const selection = (await miro.board.getSelection()).filter((widget) => widget.type === 'image')
			if (selection.length > 0) {
				const cards: CardInfo[] = data.session['decks'].flatMap((deck) => deck['cards'])
				selectedCards = cards.filter((card) => selection.some((item) => item['title'] == card.id || item['url'].endsWith(card.frontUrl))).map((card) => card.id)
			} else {
				selectedCards = []
			}

		} catch (e) {
			//allowUpload = false
			//warning = e.message
			console.warn(e)
		}
	}

	async function download() {
		const board: any = await miro.board.getInfo()
		board.description = description
		board.widgets = (await miro.board.get()).filter((widget) => widget.type !== 'image' || widget.url || widget.title)
		board['_id'] = "download:" + board.id + ":" + Date.now()
		const url = URL.createObjectURL(new Blob(
			[JSON.stringify(board)],
			{type: 'application/json'}
		));
		const a = document.createElement('a')
		a.href = url
		a.download = 'Miro ' + board.id + ' ' + new Date().toISOString().replaceAll(':', '-').slice(0, -5) + 'Z.json'
		a.click()
		setTimeout(() => {
			URL.revokeObjectURL(url);
		}, 150)
	}

	async function addCard(card: CardInfo, event, offset?: number) {
		event.target.disabled = true
		await addCardInternal(card, offset)
		event.target.disabled = false
	}

	async function addCardInternal(card: CardInfo, offset?: number) {
		const url = card['frontUrl']
		if (url) {
			let viewport = await miro.board.viewport.get()
			try {
				let image = await miro.board.createImage({
					url: new URL(url.startsWith('/') ? base + url : url, document.baseURI).href,
					// allow default = pixel width and fix next...
					x: viewport.x + viewport.width / 2 + (offset || 0) * 16,
					y: viewport.y + viewport.height / 2 + (offset || 0) * 16,
				})
				if (image.width) {
					const dpi = card.imageDpi || 300
					image.width = image.width * 96 / dpi
					await image.sync()
				}
			} catch (e) {
				console.log(`error doing createImage: ${e.message}`, e)
				// Compose the message.
				const errorNotification = {
					message: `Sorry, that card couldn't be added.`,
					type: 'error',
				};

				// Display the notification on the board UI.
				await miro.board.notifications.show(errorNotification);
			}
		}
	}

	async function addCardCategory(deck: CardDeckRevision, category: string, event) {
		event.target.disabled = true
		const cards = deck.cards.filter((card) => (card.category || '') == category)
		for (let ix = 0; ix < cards.length; ix++) {
			console.log(`add ${ix}, ${cards[ix].id}`)
			await addCardInternal(cards[ix], ix)
		}
		event.target.disabled = false
	}


	function zoomTo(item) {
		miro.board.viewport.zoomTo([item])
	}

	async function saveSession() {
		const info: any = await miro.board.getInfo()
		info.description = description
		info.widgets = (await miro.board.get()).filter((widget) => widget.type !== 'image' || widget.url || widget.title)
		info.widgets.forEach((w) => {if (w.modifiedAt && (w.modifiedAt as string).localeCompare(info.updatedAt) > 0) { info.updatedAt = w.modifiedAt }})
		const response = await fetch(`${base}/miro/${info.id}/snapshot`, {
			method: 'POST',
			body: JSON.stringify(info)
		})
		if (response.ok) {
			success = true
			error = null
			invalidateAll()
		} else {
			error = (await response.json()).message
		}
	}
</script>

<style>
	.warn {
		@apply bg-yellow-100 py-2 px-4 my-2 mx-4 font-bold rounded-xl;
	}
</style>

<!-- <div>quota {data.usageSessions}/{data.quotaSessions}, {data.usageSnapshots}/{data.quotaSnapshots}</div> -->

<div class="w-full h-screen bg-gray-100">
	<div class="subheader absolute top-0">
		<div class="flex-1">
			{#if !data.authenticated}
				Login
			{:else if data.session}
				<span class="overflow-elipsis">
				{#if data.session.name && data.session.name.toLowerCase().indexOf('session') === -1}
					Session
				{/if}
					{data.session.name}
				</span>
				{#if !data.readonly}
					<form method="post" action="?/unselect" use:enhance class="inline float-right">
						<input type="hidden" name="id" value={data.session._id}/>
						<button class="ml-1" title="Change Session" disabled={!!data.readonly} aria-label="Change Session">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 opacity-30 hover:opacity-50"
							     viewBox="0 0 20 20"
							     fill="currentColor">
								<path fill-rule="evenodd"
								      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
								      clip-rule="evenodd"/>
							</svg>
						</button>
					</form>
				{/if}
			{:else}
				Associate Board with Session
			{/if}
		</div>

		<button class="iconButton" on:click={download} title="Download Board" aria-label="Download Board">
			<svg class="w-4 mr-2" fill="currentColor" viewBox="0 0 20 20"
			     xmlns="http://www.w3.org/2000/svg">
				<path clip-rule="evenodd"
				      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
				      fill-rule="evenodd"/>
			</svg>
		</button>
		{#if data.session && !data.readonly}
			<a class="iconButton" href="{base}/sessions/{data.session._id}" title="Open Session" target="_blank" aria-label="Open Session"
			   rel="noreferrer">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4" viewBox="0 0 20 20" fill="currentColor">
					<path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
					<path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
				</svg>
			</a>
		{:else}
			<a class="iconButton" href="{base}/sessions" title="Open Cardographer" target="_blank" aria-label="Open Cardographer"
			   rel="noreferrer">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4" viewBox="0 0 20 20" fill="currentColor">
					<path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
					<path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
				</svg>
			</a>
		{/if}
	</div>

	<div class="absolute top-10 bottom-0 w-full">

		{#if !data.authenticated || !data.session}
			<div class="w-full h-full overflow-y-auto">
				<div class="flex flex-col text-sm font-medium gap-4 p-6">
					{#if !data.authenticated}
						<form method="post" action="?/login" use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type==="success") {
						console.log(`log in ok`)
						await invalidateAll()
					}
					update()
				};
			}}>
							<LoginPanel canEmail="{false}" error={form ? form.error : null}/>
						</form>
					{:else if !data.session}
						{#if data.usageSessions >= data.quotaSessions}
							<div class="message-error">You have reached you session quota.</div>
						{:else}
							<form method="post" action="?/select" use:enhance={() => {
				    return async ({ result, update }) => {
					    await invalidateAll()
						update()
                    }
				}}>
								<button class="listItem flex-col">
									<div class="flex flex-row gap-1">
										<div class="font-semibold">Create New Session</div>
									</div>
								</button>
							</form>
						{/if}
						{#each data.sessions as session}
							<form method="post" action="?/select" use:enhance>
								<input type="hidden" name="id" value="{session._id}"/>
								<button class="listItem flex-col">
									<div class="flex flex-row gap-1">
										<div class="font-semibold">Select
											{#if session.name && session.name.toLowerCase().indexOf('session') === -1}
												Session
											{/if}{session.name}</div>
										{#if session.isPublic}
											<div class="chip">Public</div>
										{/if}
										{#if session.isTemplate}
											<div class="chip">Template</div>
										{/if}
										{#if session.isArchived}
											<div class="chip">Archived</div>
										{/if}
									</div>
									{#if session.description}
										<div class="text-sm font-light">{session.description}</div>
									{/if}
								</button>
							</form>
						{/each}
					{/if}
				</div>
			</div>
		{:else}
			<LiveView session={data.session} isOwner={data.readonly===false} inmiro={true}>

				<div class="w-full h-full flex flex-col">

					<div class="flex-1 flex flex-col overflow-y-auto">
						<div class="flex flex-col text-sm font-medium gap-4 p-6">
							{#each widgets as widget (widget.id)}
								<button class="flex py-2 items-center cursor-pointer transition-opacity duration-300 hover:opacity-80"
								        on:click={() => zoomTo(widget)}>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3" fill="none"
									     viewBox="0 0 24 24"
									     stroke="#eab308" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round"
										      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
									</svg>
									{widget.type} {widget.id}
								</button>
							{/each}

							{#each data.session.decks as deck}
								{#if deck.cards}
									{#each deck.cards as card, cix}
										{#if deck.cards.map((c) => c.category || '').indexOf(card.category || '') === cix}
											<div class="flex pb-2">
												<div class="flex-1 text-lg">{deck.deckName}: {card.category || ''}</div>
												<button on:click={(event) => {addCardCategory(deck, card.category||'', event)}}
												        class="button button-slim" style="align-self: end">
													Add All
												</button>
											</div>
										{/if}
										{#if card.frontUrl}
											<ExpandableSection class="py-1">
												<div slot="title">
													<div class="flex items-center"
													     class:text-blue-700={selectedCards.includes(card.id)}>
														<img src="{base}/icons/card.svg" class="w-5 mr-4" alt=""/>
														<span>{card.name}</span>
														<span class="text-gray-400 ml-1.5">v{card.revision}</span>
													</div>
												</div>
												<div class="flex flex-col pt-1 pb-2">
													<div class="flex">
														{#if card.frontUrl}
															<img src={card.frontUrl.startsWith('/') ? base + card.frontUrl : card.frontUrl}
															     class="h-24 mr-4" alt="Card"/>
														{/if}
														<div class="flex flex-col">
															{#if card.description}
																<div class="text-xs">{card.description}</div>
															{/if}
															{#if card.content && card.content !== card.description}
																<div class="text-xs">{card.content}</div>
															{/if}
															<div>
																Type: {card.category}
															</div>
															<button on:click={(event) => {addCard(card, event)}}
															        class="button button-slim" style="align-self: end">
																Add
															</button>
														</div>
													</div>
												</div>
											</ExpandableSection>
										{/if}
									{/each}
								{/if}
							{/each}
						</div>
					</div>

					{#if widgets.length !== 0}
						<div class="warn">
							{widgets.length} image{widgets.length > 1 ? 's' : ''} will not be saved. Give them titles to
							include
							them
						</div>
					{/if}
					{#if error}
						<div class="warn">
							{error}
						</div>
					{:else if success}
						<div class="message-success">
							Uploaded
						</div>
					{/if}
					{#if data.usageSnapshots >= data.quotaSnapshots}
						<div class="gap-1 m-1 message-error">You have reached you Snapshot quota.</div>
					{:else}
						<div class="flex grow-0 gap-1 m-1 justify-center">
							<input class="flex-1 p-1" type="text" name="description" placeholder="Snapshot desription"
							       bind:value={description} disabled={!!data.readonly}/>
							<button class="button m-1" on:click={saveSession} disabled={!!data.readonly}>
								Save
							</button>
						</div>
					{/if}
				</div>
			</LiveView>
		{/if}

	</div>
</div>