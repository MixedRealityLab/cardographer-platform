<script lang="ts">
	import {base} from '$app/paths'
	import {page} from "$app/stores";
	import type {CardDeckRevision} from "$lib/types"
	import AppBar from "$lib/ui/AppBar.svelte"
	import Tab from "$lib/ui/Tab.svelte"

	let {email} = $page.params
</script>

<AppBar back="{base}/users" subtitle="User">
	<Tab url="{base}/users/{email}">
		Details
	</Tab>
</AppBar>

<slot/>