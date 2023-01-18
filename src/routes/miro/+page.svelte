<script lang="ts">
	import {base} from '$app/paths'
	import {Miro} from "@mirohq/websdk-types";

	declare const miro: Miro

	async function init() {
		miro.board.ui.on("icon:click", async () => {
			const info = await miro.board.getInfo()
			await miro.board.ui.openPanel({
				url: `${base}/miro/sidebar/${info.id}`,
				height: 400,
			});
		});
	}
	init();
</script>