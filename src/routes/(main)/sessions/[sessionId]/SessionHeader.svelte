<script lang="ts">
	import {goto} from '$app/navigation'
	import {base} from '$app/paths'
	import type {Session} from "$lib/types"
	import ConfirmDialog from '$lib/ui/ConfirmDialog.svelte'
	
	export let session: Session

	async function deleteSession() {
		const res = await fetch(`${base}/sessions/${session._id}`, {
			method: 'DELETE'
		})
		if (res.ok) {
			await goto(`${base}/sessions`)
		}
	}
</script>

<div class="subheader">
	<div class="flex-1">
		{#if (session.name ?? 'null').toLowerCase().indexOf('session') === -1}
			Session
		{/if}
		{session.name ?? 'null'}
	</div>
	<ConfirmDialog
			title="Delete {session.name}?"
			cancelTitle="Cancel"
			confirmTitle="Delete"
			let:confirm="{confirmThis}">
		<button class="iconButton" on:click={() => confirmThis(deleteSession)} aria-label="Delete Session">
		        title='Delete Session'>
			<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
				<path clip-rule="evenodd"
				      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
				      fill-rule="evenodd"/>
			</svg>
		</button>
	</ConfirmDialog>
	<slot/>
</div>