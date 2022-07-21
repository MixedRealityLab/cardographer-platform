<script lang="ts">
	import {base} from '$app/paths'
	import {Miro} from "@mirohq/websdk-types";

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

	init();
</script>