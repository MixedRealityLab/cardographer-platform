<script lang="ts">
	import {enhance} from "$app/forms";
	import {base} from "$app/paths";
	import UploadButton from "$lib/ui/UploadButton.svelte"
	import UserTabs from '$lib/ui/UserTabs.svelte'
	import type {ActionData, PageServerData} from './$types'

	export let data: PageServerData;
	export let form: ActionData
	let showArchived = false
	let message = ''
</script>

<UserTabs/>

<div class="w-full flex flex-col mb-4 text-sm font-medium p-6 gap-4">
	{#each data.sessions as session}
		{#if showArchived === session.isArchived}
			<a class="listItem flex-col" href="sessions/{session._id}">
				<div class="flex flex-row gap-1">
					<div class="font-semibold">{session.name}</div>
					{#if session.isPublic}
						<div class="chip">Public</div>
					{/if}
					{#if session.isTemplate}
						<div class="chip">Template</div>
					{/if}
					{#if session.isArchived}
						<div class="chip">Archived</div>
					{/if}
				</div>
				{#if session.description}
					<div class="text-sm font-light">{session.description}</div>
				{/if}
			</a>
		{/if}
	{:else}
		<div class="self-center">No Sessions Found</div>
	{/each}

	{#if message}
		<div class="message-success whitespace-pre-line">{message}</div>
	{/if}

	<div class="flex self-center justify-center">
		{#if data.sessions.some((session) => session.isArchived)}
			<label class="flex items-center ml-6 py-1">
				<input type="checkbox" class="hidden" bind:checked="{showArchived}">
				{#if showArchived}
					<span class="button mx-2">Hide Archived</span>
				{:else}
					<span class="button mx-2">Show Archived</span>
				{/if}
			</label>
		{/if}

		<a class="button mx-2 self-center" href="{base}/sessions/new">
			<img alt="" class="button-icon" src="{base}/icons/add.svg"/>New Session
		</a>

		<form method="post" enctype="multipart/form-data" use:enhance={() => {
				    return async ({ result, update }) => {
						console.log(result)
						update()
						message = result.data.message
	                  };
				}}>
			<UploadButton class="button mx-2 self-center" multiple={true} types=".json,application/json">
				<img alt="" class="button-icon" src="{base}/icons/upload.svg"/>Upload Sessions
			</UploadButton>
		</form>
	</div>
</div>