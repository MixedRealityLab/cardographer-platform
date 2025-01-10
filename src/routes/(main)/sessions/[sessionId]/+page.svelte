<script lang="ts">
	import {enhance} from "$app/forms";
	import UserSelect from "$lib/ui/UserSelect.svelte"
	import type {ActionData} from "./$types"
	import SessionHeader from "./SessionHeader.svelte";
	import {base} from '$app/paths'

	export let data
	export let form: ActionData

	let error = ''
</script>

<SessionHeader session={data.session}/>

<form class="p-6 flex flex-col text-sm gap-4" method="post" use:enhance>
	<label>
		<span>Session name</span>
		<input name="name" bind:value="{data.session.name}" class="mt-1 block w-full" required type="text"/>
	</label>
	<label>
		<span>Description</span>
		<textarea name="description" bind:value="{data.session.description}" class="mt-1 block w-full"
		          rows="3"></textarea>
	</label>
	<label>
		<span>Credits</span>
		<input name="credits" bind:value="{data.session.credits}" class="mt-1 block w-full" type="text"/>
	</label>
	<div>
		<span class="text-sm text-gray-800">Created</span>
		<div class="px-3">{new Date(data.session.created).toLocaleString('en-gb', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		})}</div>
	</div>
	<div>
		<span class="flex">Live session support</span>
		<div class="flex justify-left gap-4 px-3">
			<label class="flex items-center">
				<input name="isLive" bind:checked="{data.session.isLive}" class="form-checkbox"
				       type="checkbox">
				<span class="ml-2">Enable</span>
			</label>
			{#if data.session.isLive && !data.session.joiningCode} 
				<span class="message-error">Save now to generate joining codes</span>
			{/if}
			{#if data.session.isLive && data.session.joiningCode}
				<a target="_blank" href="{base}/sessions/{data.session._id}/live?j={data.session.joiningCode}" class="button flex">
					Join
				</a>
			{/if}
			{#if data.session.isLive && data.session.joiningCodeReadonly}
				<a target="_blank" href="{base}/sessions/{data.session._id}/live?j={data.session.joiningCodeReadonly}" class="button flex">
					Join (Readonly)
				</a>
			{/if}
		</div>
	</div>
	
	<div>
		<span class="text-sm text-gray-800">Session Type</span>
		<div class="px-3">{data.session.sessionType || 'Not Defined'}</div>
	</div>
	{#if data.session.sessionType === 'miro' && data.session.url && data.session.isTemplate}
		<label>
			<span>Template Miro board link (to duplicate)</span>
			<input name="miroDuplicateUrl" bind:value="{data.session.miroDuplicateUrl}" class="mt-1 block w-full"
			       type="text"/>
			<div class="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300"
			     role="alert">
				<span class="font-semibold">Note:</span> Ensure that this Miro board "Share" link allows "Anyone with
				the link": "Can View", and "Sharing Settings", "Permissions", "Who can copy board content" is "Anyone
				with the board access"
			</div>
		</label>
	{/if}
	{#if data.session.sessionType === "" && data.session.miroDuplicateUrl}
		<div class="flex justify-left gap-4">
			<a class="button" href="{data.session.miroDuplicateUrl}">
				Open Miro Board to Duplicate
			</a>
		</div>
		<div class="p-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400"
		     role="alert">
			<span class="font-semibold">Start here:</span> Click the link to open the template board in Miro, log in,
			duplicate the board into your own team and use the Cardographer Plugin to link it back to this session.
		</div>
	{/if}
	<div>
		<span class="flex">Consent Received for</span>
		<div class="flex justify-left gap-4 px-3">
			<label class="flex items-center">
				<input name="isConsentForStats" bind:checked="{data.session.isConsentForStats}" class="form-checkbox"
				       type="checkbox">
				<span class="ml-2">Stats</span>
			</label>
			<label class="flex items-center">
				<input name="isConsentForText" bind:checked="{data.session.isConsentForText}" class="form-checkbox"
				       type="checkbox">
				<span class="ml-2">Text</span>
			</label>
			<label class="flex items-center">
				<input name="isConsentForRecording" bind:checked="{data.session.isConsentForRecording}"
				       class="form-checkbox" type="checkbox">
				<span class="ml-2">Recording</span>
			</label>
			<label class="flex items-center">
				<input name="isConsentToIdentify" bind:checked="{data.session.isConsentToIdentify}"
				       class="form-checkbox"
				       type="checkbox">
				<span class="ml-2">Identity</span>
			</label>
			<label class="flex items-center">
				<input name="isConsentRequiresCredit" bind:checked="{data.session.isConsentRequiresCredit}"
				       class="form-checkbox" type="checkbox">
				<span class="ml-2">NB: Requires Attribution</span>
			</label>
		</div>
	</div>
	<label>
		<span>Consent details</span>
		<textarea name="consentDetails" bind:value="{data.session.consentDetails}" class="mt-1 block w-full"
		          rows="3"></textarea>
	</label>
	<UserSelect bind:owners={data.session.owners} name="owners" users={data.users}/>

	<div class="flex justify-center gap-4">
		<label class="flex items-center">
			<input name="isPublic" bind:checked="{data.session.isPublic}" class="form-checkbox" type="checkbox" disabled={!data.localUser?.isPublisher}>
			<span class="ml-2">Public</span>
		</label>
		<label class="flex items-center">
			<input name="isArchived" bind:checked="{data.session.isArchived}" class="form-checkbox" type="checkbox">
			<span class="ml-2">Archived</span>
		</label>
		<label class="flex items-center">
			<input name="isTemplate" bind:checked="{data.session.isTemplate}" class="form-checkbox" type="checkbox">
			<span class="ml-2">Template</span>
		</label>
	</div>

	{#if error}
		<div class="message-error">{error}</div>
	{/if}
	<div class="self-center mt-2 flex items-center">
		<svg class="h-6 w-6 mx-4 transition-opacity text-green-700 duration-500" class:opacity-0={!form?.success}
		     fill="currentColor"
		     viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
			<path clip-rule="evenodd"
			      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
			      fill-rule="evenodd"/>
		</svg>

		<input class="button" type='submit' value='Save'>
		<div class="w-14"></div>
	</div>
</form>