<script lang="ts">
	import {base} from "$app/paths";
	import type {LoginResponse} from "$lib/apitypes";
	import type {IWidget, Miro} from "$lib/miro"
	import type {CardDeckRevision, CardInfo, Session} from "$lib/types";
	import {authenticateRequest} from "$lib/ui/token";
	import {onMount} from "svelte";
	import AppBar from "../../../lib/ui/AppBar.svelte";
	import ExpandableSection from "../../../lib/ui/ExpandableSection.svelte";

	declare const miro: Miro

	export let sessions: Session[]
	let selectedSession: Session = null
	let decks: CardDeckRevision[] = []

	let title = ''
	let showLogin = false
	let session = {
		authenticated: false,
		token: ''
	}

	let email: string
	let password: string
	let working = true

	let widgets: IWidget[] = []
	let warning: string = null
	let allowUpload = false

	onMount(async () => {
		miro.onReady(() => {
			miro.addListener(miro.enums.event.SELECTION_UPDATED, updateWidgets)
			const token = localStorage.getItem('cardo_sess')
			if (token) {
				session = {
					token: token,
					authenticated: false
				}
			}
			getSessions()
			updateWidgets()
		})
	})

	function compareSessions(a: Session, b: Session) {
		const aName = `${a.name} ${a.owners[0]} ${a.created}`
		const bName = `${b.name} ${b.owners[0]} ${b.created}`
		return String(aName).localeCompare(bName)
	}

	async function getSessions() {
		const res = await fetch(`${base}/api/user/sessions`, authenticateRequest(session))
		if (res.ok) {
			const newSessions = (await res.json()).values.sort(compareSessions) as Session[]
			const url = 'https://miro.com/app/board/' + (await miro.board.info.get()).id
			const filtered = newSessions.filter((session) => session.sessionType === 'miro' && session.url === url)
			if (filtered.length === 1) {
				await selectSession(filtered[0])
			}
			sessions = newSessions
			session.authenticated = true
		} else if (res.status === 401) {
			session = {
				token: '',
				authenticated: false
			}
		}
		working = false
	}

	async function updateWidgets() {
		try {
			const allWidgets = await miro.board.widgets.get()
			const images = allWidgets.filter((widget) => widget.type === "IMAGE").length
			if (images === 0) {
				warning = "No cards found on board"
				widgets = []
				allowUpload = false
			} else {
				widgets = allWidgets.filter((widget) => widget.type === "IMAGE" && widget.url === '' && widget.title === '')
				warning = null
				allowUpload = true
			}
		} catch (e) {
			allowUpload = false
			warning = e.message
			console.warn(e)
		}
	}

	async function selectSession(newSession: Session) {
		selectedSession = newSession
		const response = await fetch(`${base}/api/user/sessions/${newSession._id}/decks`, authenticateRequest(session))
		if (response.ok) {
			decks = await response.json()
		}
	}

	async function selectWidget(widget: IWidget) {
		await miro.board.selection.selectWidgets(widget.id)
		const width = widget.bounds.right - widget.bounds.left
		const height = widget.bounds.bottom - widget.bounds.top
		const rect = {
			x: widget.bounds.left - (width / 2),
			y: widget.bounds.top - (height / 2),
			width: width * 2,
			height: height * 2
		}
		await miro.board.viewport.set(rect)
	}

	async function download() {
		const board = await getBoard()
		board['_id'] = "download:" + board.id + ":" + Date.now()
		const url = URL.createObjectURL(new Blob(
			[JSON.stringify(board)],
			{type: 'application/json'}
		));

		const a = document.createElement('a')
		a.href = url
		a.download = 'Miro ' + board.title + ' ' + new Date().toISOString().replaceAll(':', '-').slice(0, -5) + 'Z.json'
		a.click()
		setTimeout(() => {
			URL.revokeObjectURL(url);
		}, 150)
	}

	async function saveSession() {
		const board = await getBoard()
		working = true
		const response = await fetch(`${base}/api/user/sessions/${selectedSession._id}/snapshot`, authenticateRequest(session, {
			method: 'PUT',
			headers: {'content-type': 'application/json'},
			body: JSON.stringify({
				url: 'https://miro.com/app/board/' + board.id,
				snapshot: board
			})
		}))
		if (response.ok) {
			warning = null
			selectedSession = await response.json()
			const index = sessions.findIndex((sess) => sess._id === selectedSession._id)
			if (index === -1) {
				sessions.push(selectedSession)
			} else {
				sessions[index] = selectedSession
			}
		} else {
			warning = response.statusText
		}
		working = false
	}

	async function handleLogin() {
		if (!email) {
			return;
		}
		working = true
		const response = await fetch(`${base}/api/user/login`, {
			method: 'POST',
			headers: {'content-type': 'application/json'},
			body: JSON.stringify({
				email: email,
				password: password
			})
		})
		if (response.ok) {
			const login = await response.json() as LoginResponse
			if (login.error) {
				warning = login.error;
				return;
			}
			session.token = login.token
			await getSessions()
			if (session.authenticated) {
				localStorage.setItem('cardo_sess', login.token)
			}
		} else {
			warning = 'Sorry, there was a problem logging in with those details. Please try again or contact the system administrator for help.'
		}
		working = false
	}

	async function addCard(card: CardInfo) {
		console.log({
			type: 'IMAGE',
			url: new URL(card.frontUrl.startsWith('/') ? base + card.frontUrl : card.frontUrl, document.baseURI).href
		})
		await miro.board.widgets.create({
			type: 'IMAGE',
			url: new URL(card.frontUrl.startsWith('/') ? base + card.frontUrl : card.frontUrl, document.baseURI).href
		})
	}

	async function getBoard() {
		const widgets = await miro.board.widgets.get()
		const filtered = widgets.filter((widget) => widget.type !== "IMAGE" || widget.url || widget.title)

		const board = await miro.board.info.get()
		board.widgets = filtered
		return board
	}
</script>

<style>
    .warn {
        @apply bg-yellow-100 py-2 px-4 my-2 mx-4 font-bold rounded-xl;
    }

    .tab {
        @apply px-4 rounded-t py-1 cursor-pointer transition-colors duration-500 text-gray-200;
    }

    .tabSelected {
        @apply bg-gray-300 cursor-default text-gray-900;
    }

    .tab:hover:not(.tabSelected) {
        @apply bg-gray-600;
    }
</style>

<div class="w-full flex flex-col h-screen">
	<AppBar>
		<div slot="subheader" class="flex items-center">
			{#if !session.authenticated && !working}
				Login
			{:else if selectedSession}
				{#if selectedSession.name.toLowerCase().indexOf('session') === -1}
					Session
				{/if}
				{selectedSession.name}
				<button class="ml-1" on:click={() => selectedSession = null} title="Change Session">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 opacity-30 hover:opacity-50"
					     viewBox="0 0 20 20"
					     fill="currentColor">
						<path fill-rule="evenodd"
						      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
						      clip-rule="evenodd"/>
					</svg>
				</button>
				<span class="flex-1">&nbsp;</span>
				<button class="ml-1" on:click={download} title="Download">
					<svg class="w-4 mr-2" fill="currentColor" viewBox="0 0 20 20"
					     xmlns="http://www.w3.org/2000/svg">
						<path clip-rule="evenodd"
						      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
						      fill-rule="evenodd"/>
					</svg>
				</button>
				<a class="block" href="{base}/user/sessions/{selectedSession._id}"
				   target="_blank">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4" viewBox="0 0 20 20" fill="currentColor">
						<path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
						<path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
					</svg>
				</a>
			{:else}
				Select Session
			{/if}
		</div>
	</AppBar>
	<div class="flex flex-1 flex-col text-sm font-medium gap-4 p-6 overflow-y-scroll">
		{#if !session.authenticated && !working}
			{#if !showLogin}
				<div class="flex justify-center gap-4">
					<button class="button" disabled={!allowUpload} on:click={download}>
						<svg class="w-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20"
						     xmlns="http://www.w3.org/2000/svg">
							<path clip-rule="evenodd"
							      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
							      fill-rule="evenodd"/>
						</svg>
						Download
					</button>
					<button class="button" on:click={() => {showLogin = true}}>Login</button>
				</div>
			{:else}
				<form on:submit|preventDefault={handleLogin} class="mx-8 flex flex-col gap-2">
					<label>
						<span>Email</span>
						<input bind:value="{email}" class="w-full" id="email" required type="text"/>
					</label>
					<label>
						<span>Password</span>
						<input bind:value="{password}" class="w-full" id="password" required type="password"/>
					</label>
					<input class="button" disabled={working} type='submit' value='Log in'>
				</form>
			{/if}
		{/if}

		{#if warning}
			<div class="warn">{warning}</div>
		{/if}
		{#if session.authenticated}
			{#if !selectedSession}
				{#each sessions as session}
					{#if !session.isArchived}
						<div class="listItem flex-col" on:click={() => {selectSession(session)}}>
							<div class="flex flex-row gap-1">
								<div class="font-semibold">{session.name}</div>
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
						</div>
					{/if}
				{/each}
				<div class="listItem flex-col" on:click={() => {selectSession({_id: 'new', name: 'New Session'})}}>
					<div class="flex flex-row gap-1">
						<div class="font-semibold">Create New Session</div>
					</div>
				</div>
				<div class="flex gap-4 justify-center">
					<button class="button" disabled={!allowUpload} on:click={download}>
						Download
					</button>
				</div>
			{:else }
				<div class="flex-1 flex flex-col">
					<div class="flex-1">
						{#each widgets as widget (widget.id)}
							<div on:click={() => selectWidget(widget)}
							     class="py-2 px-8 cursor-pointer transition-opacity duration-300 hover:opacity-50">
								Image {widget.id}
							</div>
						{/each}

						{#each decks as deck}
							<div>Deck {deck.deckName}</div>
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
										<div>
											<div class="ml-9">
												<div class="flex">
													{#if card.frontUrl}
														<img src={card.frontUrl.startsWith('/') ? base + card.frontUrl : card.frontUrl}
														     class="h-48" alt="Card"/>
													{/if}
													<div>
														{#if card.description}
															<div class="text-sm">{card.description}</div>
														{/if}
														{#if card.content}
															<div>{card.content}</div>
														{/if}
														<div>
															Type: {card.category}
														</div>
													</div>
													<button on:click={() => {addCard(card)}}>Add</button>
												</div>
											</div>
										</div>
									</ExpandableSection>
								{/if}
							{/each}
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
	{#if selectedSession}
		{#if widgets.length !== 0}
			<div class="warn">
				{widgets.length} images will not be saved to session. Give them titles to include them
				in the upload
			</div>
		{/if}
		<div class="flex gap-4 justify-center">
			<button class="button" disabled={!allowUpload} on:click={saveSession}>
				Save Session
			</button>
		</div>
	{/if}
</div>