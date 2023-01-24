<!--suppress HtmlUnknownTag -->
<script lang="ts">
	import {enhance} from "$app/forms";
	import {base} from "$app/paths"
	import type {CardInfo, Session} from "$lib/types"
	import ExpandableSection from "$lib/ui/ExpandableSection.svelte"
	import LoginPanel from "$lib/ui/LoginPanel.svelte";

	import type {BoardNode, Item, Miro} from "@mirohq/websdk-types";
	import {onMount} from "svelte";

	declare const miro: Miro
	export let data: { authenticated: boolean; session: Session; sessions: Session[] }
	let selectedCard: CardInfo
	let widgets: BoardNode[] = []
	let error: string
	let success: boolean = false

	onMount(async () => {
		miro.board.ui.on('selection:update', updateWidgets)
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

			const selection = await miro.board.getSelection()
			await selectWidget(selection.filter((widget) => widget.type === 'image'))
			if (selection.length == 1) {
				if (selection[0].type == 'image') {
					console.log(selection)
					if (data.session) {
						console.log(data.session.decks)
					}
				}
			}

		} catch (e) {
			//allowUpload = false
			//warning = e.message
			console.warn(e)
		}
	}

	async function selectWidget(widgets: Item[]) {
		if (widgets.length > 0) {
			await miro.board.viewport.zoomTo(widgets)
		}
	}

	async function addCard(card: CardInfo, event) {
		event.target.disabled = true
		const url = card['frontUrl']
		if (url) {
			await miro.board.createImage({
				url: new URL(url.startsWith('/') ? base + url : url, document.baseURI).href
			})
		}
		event.target.disabled = false
	}

	async function saveSession() {
		const info: any = await miro.board.getInfo()
		info.widgets = await miro.board.get()
		console.log(info)
		const response = await fetch(`${base}/miro/${info.id}/snapshot`, {
			method: 'POST',
			body: JSON.stringify(info)
		})
		if (response.ok) {
			success = true
			error = null
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

<div class="w-full flex flex-col h-screen">
	<div class="subheader">
		<div class="flex-1">
			{#if !data.authenticated}
				Login
			{:else if data.session}
				{#if data.session.name.toLowerCase().indexOf('session') === -1}
					Session
				{/if}
				{data.session.name}
				<form method="post" action="?/unselect" use:enhance class="inline">
					<input type="hidden" name="id" value={data.session._id}/>
					<button class="ml-1" title="Change Session">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 opacity-30 hover:opacity-50"
						     viewBox="0 0 20 20"
						     fill="currentColor">
							<path fill-rule="evenodd"
							      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							      clip-rule="evenodd"/>
						</svg>
					</button>
				</form>
			{:else}
				Associate Board with Session
			{/if}
		</div>
		<button class="iconButton" title="Download Board">
			<svg class="w-4 mr-2" fill="currentColor" viewBox="0 0 20 20"
			     xmlns="http://www.w3.org/2000/svg">
				<path clip-rule="evenodd"
				      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
				      fill-rule="evenodd"/>
			</svg>
		</button>
		{#if data.session}
			<a class="iconButton" href="{base}/sessions/{data.session._id}" title="Open Session" target="_blank"
			   rel="noreferrer">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4" viewBox="0 0 20 20" fill="currentColor">
					<path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
					<path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
				</svg>
			</a>
		{/if}
	</div>

	<div class="flex flex-1 flex-col text-sm font-medium gap-4 p-6 overflow-y-auto">
		{#if !data.authenticated}
			<form method="post" action="?/login" use:enhance>
				<LoginPanel/>
			</form>
		{:else if !data.session}
			<form method="post" action="?/select" use:enhance>
				<input type="hidden" name="id" value="new"/>
				<button class="listItem flex-col">
					<div class="flex flex-row gap-1">
						<div class="font-semibold">Create New Session</div>
					</div>
				</button>
			</form>
			{#each data.sessions as session}
				<form method="post" action="?/select" use:enhance>
					<input type="hidden" name="id" value="{session._id}"/>
					<button class="listItem flex-col">
						<div class="flex flex-row gap-1">
							<div class="font-semibold">Select
								{#if session.name.toLowerCase().indexOf('session') === -1}
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
			<div class="flex gap-4 justify-center">
				<button class="button">
					Download
				</button>
			</div>
		{:else }
			<div class="flex-1 flex flex-col">
				<div class="flex-1">
					{#each widgets as widget (widget.id)}
						<button class="flex py-2 items-center cursor-pointer transition-opacity duration-300 hover:opacity-80"
						        on:click={() => selectWidget([widget])}>
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
							<div class="text-lg pb-2">{deck.deckName}</div>
							{#each deck.cards as card}
								{#if card.frontUrl}
									<ExpandableSection class="py-1">
										<div slot="title">
											<div class="flex items-center">
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
		{/if}
	</div>
	{#if data.session}
		{#if widgets.length !== 0}
			<div class="warn">
				{widgets.length} image{widgets.length > 1 ? 's' : ''} will not be saved. Give them titles to include
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
		<div class="flex gap-4 justify-center">
			<button class="button m-2" on:click={saveSession}>
				Save Session
			</button>
		</div>
	{/if}
</div>