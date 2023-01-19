<script lang="ts">
	import {page} from '$app/stores'
	import AppBar from "$lib/ui/AppBar.svelte"
</script>

<AppBar back="javascript:history.back()"/>

<h1 class="p-2">{$page.status}: {$page.error.message}</h1>