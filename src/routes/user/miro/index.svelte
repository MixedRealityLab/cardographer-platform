<script lang="ts">
	import {base} from '$app/paths'
	import type {Miro} from "$lib/miro";
	import {onMount} from "svelte";

	declare const miro: Miro
	const {board} = miro;

	async function init() {
		board.ui.on("icon:click", async () => {
			await board.ui.openPanel({
				url: `${base}/user/miro/sidebar`,
				height: 400,
			});
		});
	}

	onMount(async () => {
		await init();
	})
</script>