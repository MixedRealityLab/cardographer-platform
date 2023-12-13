<script lang="ts">
	import {enhance} from "$app/forms";
	import {base} from "$app/paths";
	import {formatDate} from "$lib/ui/formatutils";
	import UploadButton from "$lib/ui/UploadButton.svelte"
	import UserTabs from '$lib/ui/UserTabs.svelte'
	import type {PageServerData} from './$types'

	export let data: PageServerData
	let showArchived = false
	let message = ''
</script>

<UserTabs/>

<div class="w-full flex flex-col mb-4 text-sm font-medium p-6 gap-4">
	{#each data.sessions as session}
		{#if showArchived === session.isArchived}
			<a class="listItem flex-col" href="{base}/sessions/{session._id}">
				<div class="flex">
					<div class="flex-1 flex items-center gap-1">
						<div class="font-semibold">{session.name}</div>
						{#if session.isConsentForStats}
							<div class="chip">Stats</div>
						{/if}
						{#if session.isConsentForText}
							<div class="chip">Text</div>
						{/if}
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
					<div class="text-xs text-gray-600">{formatDate(session.created)}</div>
				</div>
				{#if session.description}
					<div class="flex">
						<div class="text-sm font-light">{session.description}</div>
					</div>
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