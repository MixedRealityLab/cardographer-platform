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
					authenticated: true,
					sessions: (await res.json()).values.sort(compareSessions)
				}
			};
		}

		return {
			props: {
				authenticated: false,
				sessions: []
			}
		}
	}

	function compareSessions(a: Session, b: Session) {
		const aName = `${a.name} ${a.owners[0]} ${a.created}`
		const bName = `${b.name} ${b.owners[0]} ${b.created}`
		return String(aName).localeCompare(bName)
	}
</script>

<script lang="ts">
	import {goto} from "$app/navigation";
	import {session} from "$app/stores";
	import {LoginResponse} from "$lib/apitypes";
	import type {IWidget, Miro} from "$lib/miro"
	import {UserSession} from "$lib/systemtypes";
	import {authenticateRequest} from "$lib/ui/token";
	import {onMount} from "svelte";

	declare const miro: Miro

	export let authenticated: boolean
	export let sessions: Session[]

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
		})
	})

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
		});
		if (response.ok) {
			const login = await response.json() as LoginResponse;
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
			const response = await fetch(`${base}/api/user/sessions`, authenticateRequest(session));
			if(response.ok) {
				sessions = (await response.json()).values.sort(compareSessions)
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

    button {
        @apply my-2 mx-8 rounded-xl py-2 px-8 bg-blue-600 text-white font-bold transition-opacity duration-300 hover:opacity-75 disabled:opacity-25 disabled:cursor-default;
    }
</style>

<div class="flex flex-col" style="font: 14px OpenSans, Arial, Helvetica, sans-serif;">
	<h1 class="text-2xl font-extrabold items-center p-4">Cardographer</h1>
	<button disabled={!allowUpload} on:click={download}>Download Board</button>
	{#if !authenticated}
		{#if !showLogin}
			<button disabled={!allowUpload} on:click={() => {showLogin = true}}>Login</button>
		{:else}
			<form on:submit|preventDefault={handleLogin}>
				<label>
					<span>Email</span>
					<input bind:value="{email}" class="w-full" id="email" required type="text"/>
				</label>
				<label>
					<span>Password</span>
					<input bind:value="{password}" class="w-full" id="password" required type="password"/>
				</label>
				<input class="button self-center" disabled={working} type='submit' value='Log in'>
			</form>
		{/if}
	{/if}

	{#if warning}
		<div class="warn">{warning}</div>
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