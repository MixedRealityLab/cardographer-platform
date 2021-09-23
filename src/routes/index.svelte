<script lang="ts" context="module">
	import {base} from "$app/paths"
	import type {LoadOutput} from "@sveltejs/kit"

	export async function load(): Promise<LoadOutput> {
		return {status: 301, redirect: `${base}/user/decks`}
	}
</script>