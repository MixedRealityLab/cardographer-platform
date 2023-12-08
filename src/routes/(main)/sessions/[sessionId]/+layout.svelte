<script lang="ts">
	import {base} from '$app/paths'
	import {page} from '$app/stores'
	import type {Session} from "$lib/types"
	import AppBar from "$lib/ui/AppBar.svelte"
	import Tab from "$lib/ui/Tab.svelte"

	export let data: Session
	const {sessionId} = $page.params
</script>

<AppBar back="{base}/sessions" subtitle="Session">
	<Tab url="{base}/sessions/{sessionId}">
		Details
	</Tab>
	<Tab url="{base}/sessions/{sessionId}/decks">
		Decks
	</Tab>
	<!-- <Tab url="{base}/sessions/{sessionId}/board">
		Board
	</Tab> -->
	{#if data && data.decks && data.decks.length !== 0}
		<Tab url="{base}/sessions/{sessionId}/cards">
			WebApp
		</Tab>
	{/if}
	{#if data && data.decks && data.decks.length !== 0 && (!data.sessionType || data.sessionType === 'tabletop')}
		<Tab url="{base}/sessions/{sessionId}/tabletop">
			Tabletop
		</Tab>
	{/if}
	{#if data && data.sessionType == 'miro' && data.url}
		<Tab url="{data.url}">
			Miro
		</Tab>
	{/if}
</AppBar>

<slot/>