<script context="module" lang="ts">
	import type {ErrorLoad} from "@sveltejs/kit"

	export const load: ErrorLoad = async function ({error, status}) {
		console.log(`${error.name}: ${error.message}`, error.stack)
		return {
			props: {
				title: `${status}: ${error.message}`
			}
		};
	}
</script>

<script lang="ts">
	import AppBar from "$lib/ui/AppBar.svelte";
	import {base} from "$app/paths";

	export let title: string;
</script>

<AppBar back="{base}/user/decks"/>


<h1 class="p-6">{title}</h1>
