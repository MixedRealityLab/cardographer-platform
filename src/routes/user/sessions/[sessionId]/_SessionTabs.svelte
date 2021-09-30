<script type="ts">
	import {base} from "$app/paths"
	import {page} from '$app/stores'
	import type {Session} from "$lib/types"
	import AppBar from "$lib/ui/AppBar.svelte"
	import Tab from "$lib/ui/Tab.svelte"

	export let session: Session
	let {sessionId} = $page.params
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
	{#if session && session.decks && session.decks.length !== 0}
		<Tab url="{base}/user/sessions/{sessionId}/tabletop">
			Tabletop
		</Tab>
	{/if}
	<div slot="subheader">
		{#if session.name.toLowerCase().indexOf('session') === -1}
			Session
		{/if}
		{session.name}
	</div>
</AppBar>