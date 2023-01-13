<script lang="ts">
	import {goto} from "$app/navigation";
	import {base} from '$app/paths'
	import {page} from '$app/stores'
	import type {Session} from "$lib/types"
	import AppBar from "$lib/ui/AppBar.svelte"
	import ConfirmDialog from "$lib/ui/ConfirmDialog.svelte";
	import Tab from "$lib/ui/Tab.svelte"

	export let data: Session
	const {sessionId} = $page.params

	async function deleteSession() {
		const res = await fetch(`${base}/api/user/sessions/${sessionId}`, {
			method: 'DELETE'
		})
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
	{#if data && data.decks && data.decks.length !== 0 && (!data.sessionType || data.sessionType === 'tabletop')}
		<Tab url="{base}/user/sessions/{sessionId}/tabletop">
			Tabletop
		</Tab>
	{/if}
</AppBar>

<slot/>