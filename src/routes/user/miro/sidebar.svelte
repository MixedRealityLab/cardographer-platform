<script context="module" lang="ts">
	import {base} from '$app/paths'
	import type {Session} from "$lib/types";
	import {authenticateRequest} from "$lib/ui/token"
	import type {LoadInput, LoadOutput} from '@sveltejs/kit'

	export async function load({fetch, session}: LoadInput): Promise<LoadOutput> {
		const res = await fetch(`${base}/api/user/sessions`, authenticateRequest(session))
		if (res.ok) {
			return {
				props: {
					sessions: (await res.json()).values.sort(compareSessions)
				}
			};
		}
		return {props: {sessions: []}};
	}

	function compareSessions(a: Session, b: Session) {
		const aName = `${a.name} ${a.owners[0]} ${a.created}`
		const bName = `${b.name} ${b.owners[0]} ${b.created}`
		return String(aName).localeCompare(bName)
	}
</script>

<script lang="ts">
	import {session} from "$app/stores";
	import {LoginResponse} from "$lib/apitypes";
	import type {IWidget, Miro} from "$lib/miro"
	import {UserSession} from "$lib/systemtypes";
	import type {CardDeckRevision} from "$lib/types";
	import {onMount} from "svelte";

	declare const miro: Miro

	export let sessions: Session[]
	let selectedSession: Session = null
	let decks: CardDeckRevision[] = []

	let title = ''
	let showLogin = false

	let email: string
	let password: string
	let working: boolean = false

	let widgets: IWidget[] = []
	let warning: string = null
	let allowUpload = false

	onMount(async () => {
		miro.onReady(() => {
			miro.addListener(miro.enums.event.SELECTION_UPDATED, updateWidgets)
			updateWidgets()
			updateSelected()
		})
	})

	async function updateSelected() {
		const url = 'https://miro.com/app/board/' + (await miro.board.info.get()).id
		const filtered = sessions.filter((session) => {
			session.url === url
		})
		if (filtered.length === 1) {
			await selectSession(filtered[0])
		}
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
				warning = ""
				allowUpload = true
			}
		} catch (e) {
			allowUpload = false
			warning = e.message
			console.warn(e)
		}
	}

	async function selectSession(newSession: Session) {
		console.log(newSession)
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
		const response = await fetch(`${base}/api/sessions/${selectedSession._id}/snapshot`, {
			method: 'PUT',
			headers: {'content-type': 'application/json'},
			body: JSON.stringify({
				url: 'https://miro.com/app/board/' + board.id,
				snapshot: board
			})
		})
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
			const user: UserSession = {
				email: email,
				authenticated: true,
				token: login.token
			}
			session.user = user
			const response2 = await fetch(`${base}/api/user/sessions`, authenticateRequest(session))
			if (response2.ok) {
				sessions = (await response2.json()).values.sort(compareSessions)
				updateSelected()
			}
			console.log(`logged in as ${email} with ${user.token}`)
		} else {
			warning = 'Sorry, there was a problem logging in with those details. Please try again or contact the system administrator for help.'
		}
		working = false
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
</style>

<div class="w-full flex flex-col">
	<div class="w-full py-1 px-2 bg-gray-700 text-2xl text-white flex items-center">
		<div class="px-2 py-1 font-bold font-title">Cardographer</div>
	</div>
	<div class="w-full block bg-gray-300 font-semibold px-5 py-1.5">
		{#if !$session.user?.authenticated}
			Login
		{:else if !selectedSession}
			Select Session
		{:else}
			{#if selectedSession.name.toLowerCase().indexOf('session') === -1}
				Session
			{/if}
			{selectedSession.name}
		{/if}
	</div>
	<div class="mb-4 text-sm font-medium gap-4 p-6">
		{#if !$session.user?.authenticated}
			{#if !showLogin}
				<div class="flex p-4">
					<button class="button" disabled={!allowUpload} on:click={download}>
						<svg class="w-4 mr-2" fill="currentColor" viewBox="0 0 20 20"
						     xmlns="http://www.w3.org/2000/svg">
							<path clip-rule="evenodd"
							      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
							      fill-rule="evenodd"/>
						</svg>
						Download Board
					</button>
					<button class="button" on:click={() => {showLogin = true}}>Login</button>
				</div>
			{:else}
				<form on:submit|preventDefault={handleLogin} class="mx-8 flex flex-col gap-2 p-4">
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
		{#if $session.user?.authenticated}
			{#if selectedSession === null}
				{#each sessions as session}
					{#if !session.isArchived}
						<a class="listItem flex-col" on:click={() => {selectSession(session)}}>
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
						</a>
					{/if}
				{/each}
			{:else }
				<div class="flex gap-4 justify-center">
					<button class="button" disabled={!allowUpload} on:click={download}>
						<svg class="w-4 mr-2" fill="currentColor" viewBox="0 0 20 20"
						     xmlns="http://www.w3.org/2000/svg">
							<path clip-rule="evenodd"
							      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
							      fill-rule="evenodd"/>
						</svg>
						Download Board
					</button>
					<button class="button" disabled={!allowUpload} on:click={saveSession}>
						Save Session
					</button>
				</div>
			{/if}
		{/if}

		{#if widgets.length !== 0}
			<div class="warn">
				{widgets.length} images will not be downloaded. Give them titles to include them in the upload
			</div>
		{/if}
		{#each widgets as widget (widget.id)}
			<div on:click={() => selectWidget(widget)}
			     class="py-2 px-8 cursor-pointer transition-opacity duration-300 hover:opacity-50">
				Image {widget.id}
			</div>
		{/each}
	</div>
</div>