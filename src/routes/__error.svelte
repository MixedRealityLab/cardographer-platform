<script context="module" lang="ts">
	import type {ErrorLoadInput, LoadOutput} from "@sveltejs/kit"

	export async function load({error, status}: ErrorLoadInput): Promise<LoadOutput> {
		console.log(`${error.name}: ${error.message}`, error.stack)
		return {
			props: {
				title: `${status}: ${error.message}`
			}
		};
	}
</script>

<script>
	import AppBar from "$lib/ui/AppBar.svelte";
	import {base} from "$app/paths";

	export let title;
</script>

<AppBar back="{base}/user/decks"/>


<h1 class="p-6">{title}</h1>
