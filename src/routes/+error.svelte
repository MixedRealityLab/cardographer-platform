<script lang="ts">
	import AppBar from "$lib/ui/AppBar.svelte";
	import {base} from "$app/paths";

	import { page } from '$app/stores';
</script>

<AppBar back="{base}/user/decks"/>

<h1>{$page.status}: {$page.error.message}</h1>