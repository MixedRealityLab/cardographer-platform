<script lang="ts">
	import {base} from "$app/paths";
	import AppBar from '$lib/ui/AppBar.svelte'
	import type {PageData} from './$types'

	export let data: PageData

	let error = ''
</script>

<AppBar back="{base}/sessions">
	<div slot="subheader">Create Session</div>
</AppBar>

<div class="w-full flex flex-col text-sm font-medium p-6">
	{#if error}
		<div class="message-error">{error}</div>
	{/if}
	<form method="post">
		<input type="hidden" name="id" value="blank">
		<button class="listItem flex-col">
			<div class="flex flex-row gap-1">
				<div>Create Blank Session</div>
			</div>
		</button>
	</form>

	{#each data.sessions as session}
		<form method="post">
			<input type="hidden" name="id" value={session._id}>
			<button class="listItem flex-col mt-2">
				<div class="flex flex-row gap-2">
					{#if session.name.includes('Session')}
						<div>Create Copy of {session.name}</div>
					{:else}
						<div>Create Copy of Session {session.name}</div>
					{/if}
					{#if session.sessionType}
						<div class="chip">{session.sessionType}</div>
					{/if}
					{#if session.isPublic}
						<div class="chip">Public</div>
					{/if}
				</div>
				<div class="text-gray-700">{session.owners[0]}</div>
				{#if session.description}
					<div class="text-sm font-light">{session.description}</div>
				{/if}
			</button>
		</form>
	{/each}
</div>