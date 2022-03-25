<script type="ts">
	import {goto} from '$app/navigation'
	import {base} from '$app/paths'
	import {page, session as pageSession} from '$app/stores'
	import type {Session} from "$lib/types"
	import AppBar from "$lib/ui/AppBar.svelte"
	import ConfirmDialog from '$lib/ui/ConfirmDialog.svelte'
	import Tab from "$lib/ui/Tab.svelte"
	import {authenticateRequest} from "$lib/ui/token";

	export let session: Session
	let {sessionId} = $page.params

	async function deleteSession() {
		const res = await fetch(`${base}/api/user/sessions/${sessionId}`, authenticateRequest($pageSession, {
			method: 'DELETE'
		}))
		if (res.ok) {
			await goto(`${base}/user/sessions`)
		}
	}
</script>

<AppBar back="{base}/user/sessions">
	<Tab url="{base}/user/sessions/{sessionId}">
		Details
	</Tab>
	<Tab url="{base}/user/sessions/{sessionId}/decks">
		Decks
	</Tab>
	<Tab url="{base}/user/sessions/{sessionId}/board">
		Board
	</Tab>
	{#if session && session.decks && session.decks.length !== 0 && (!session.sessionType || session.sessionType === 'tabletop')}
		<Tab url="{base}/user/sessions/{sessionId}/tabletop">
			Tabletop
		</Tab>
	{/if}
	<div class="flex" slot="subheader">
		<div class="flex-1">
			{#if session.name.toLowerCase().indexOf('session') === -1}
				Session
			{/if}
			{session.name}
		</div>
		<ConfirmDialog
				title="Delete {session.name}?"
				cancelTitle="Cancel"
				confirmTitle="Delete"
				let:confirm="{confirmThis}">
			<button class="iconButton" on:click={() => confirmThis(deleteSession)}
			        title='Delete Session'>
				<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
					<path clip-rule="evenodd"
					      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
					      fill-rule="evenodd"/>
				</svg>
			</button>
		</ConfirmDialog>
		<slot/>
	</div>
</AppBar>