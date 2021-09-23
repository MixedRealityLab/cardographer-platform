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
	<Tab url="{base}/user/sessions/{sessionId}/snapshots">
		Snapshots
	</Tab>
	<Tab url="{base}/user/sessions/{sessionId}/decks">
		Decks
	</Tab>
</AppBar>
<div class="w-full block bg-gray-100 font-semibold px-4 py-1">{session.name}</div>
