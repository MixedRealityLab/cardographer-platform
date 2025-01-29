<script lang="ts">
	import {enhance} from "$app/forms"
	import {goto} from "$app/navigation"
	import {base} from '$app/paths'
	import {page} from "$app/stores"
	import AppBar from "$lib/ui/AppBar.svelte"
	import ConfirmDialog from "$lib/ui/ConfirmDialog.svelte"

	export let data

	let error = ''
	let message = ''
	let emailWorking = false
	let emailSuccess = ''
	let emailError = ''

	async function deleteUser() {
		const {email} = $page.params;
		await fetch(`${base}/users/${email}`, {
			method: 'DELETE'
		})
		await goto(`${base}/users`);
	}
</script>

<AppBar back="{base}/users" subtitle="User"></AppBar>

<div class="subheader">
	<div class="flex-1">
		<div class="inline-flex items-center gap-2">{data.user.name}
			<span class="opacity-50">&lt;{data.user.email}&gt;</span>
		</div>
	</div>
</div>
<div class="gap-4 flex flex-col">
	<form class="p-6 pb-0 flex flex-col" method="post" action="?/changeEmail" use:enhance>
		<label>
			<span>Email</span>
			<input name="userEmail" bind:value={data.user.email} class="block w-full" required type="text"
				disabled={!data.localUser.isAdmin}/>
		</label>
		<div class="flex pt-2 justify-center">
			{#if data.localUser.isAdmin}

				<input disabled={data.user.email===data.email} class="button self-center mt-2" type='submit' value='Change Email'>
			{/if}
		</div>
	</form>
	<div class="flex gap-0 justify-center">
		<form method="post" action="?/verifyEmail" use:enhance={() => {
			emailWorking = true
			return async ({ result, update }) => {
				emailWorking = false
				emailSuccess = result.type === "success" ? 'Done!' : ''
				update()
			};
		}}>
			<input disabled={emailWorking || data.user.email!==data.email} class="button self-center mt-0" type='submit' value={data.user.isVerified ? "Send Email to Change Password" : "Send Email to Verify User"}>
		</form>
	</div>
	{#if emailError}
		<div class="message-error">{emailError}</div>
	{/if}
	{#if emailSuccess}
		<div class="message-success">{emailSuccess}</div>
	{/if}
</div>
<form class="p-6 flex flex-col gap-4" method="post" action="?/save" use:enhance>
	<label>
		<span>Name</span>
		<input name="userName" bind:value={data.user.name} class="block w-full" required type="text"
		/>
	</label>
	<div>
		<span class="text-sm text-gray-800">Created</span>
		<div class="px-3">{new Date(data.user.created).toLocaleString('en-gb', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		})}</div>
	</div>
	<div class="flex flex-wrap justify-center gap-4 py-1">
		<label class="flex items-center gap-2">
			<input name="isDisabled" bind:checked={data.user.disabled} class="form-checkbox" type="checkbox"
			       disabled={!data.localUser.isAdmin}>
			<span>Disabled</span>
		</label>
		<label class="flex items-center gap-2">
			<input name="isVerified" bind:checked={data.user.isVerified} class="form-checkbox" type="checkbox"
			       disabled={true}>
			<span>Verified</span>
		</label>
		<label class="flex items-center gap-2">
			<input name="isDeckBuilder" bind:checked={data.user.isDeckBuilder} class="form-checkbox" type="checkbox"
			       disabled={!data.localUser.isAdmin}>
			<span>DeckBuilder</span>
		</label>
		<label class="flex items-center gap-2">
			<input name="isPublisher" bind:checked={data.user.isPublisher} class="form-checkbox" type="checkbox"
			       disabled={!data.localUser.isAdmin}>
			<span>Publisher</span>
		</label>
		<label class="flex items-center gap-2">
			<input name="isAdmin" bind:checked={data.user.isAdmin} class="form-checkbox" type="checkbox"
			       disabled={!data.localUser.isAdmin}>
			<span>Admin</span>
		</label>

	</div>

	{#if error}
		<div class="message-error">{error}</div>
	{/if}
	{#if message}
		<div class="message-success">{message}</div>
	{/if}

	<input class="button self-center mt-2" type='submit' value='Save'>

	<label>
		<span>Quota of extra Decks (using {data.usage.decks}; base quota is {data.quotaDetails.baseQuota.decks})</span>
		<input name="extraDecks" bind:value={data.quotaDetails.extraQuota.decks} class="block w-full" required
		       type="number" min="0"
		       disabled={!data.localUser.isAdmin}/>
	</label>
	<label>
		<span>Quota of extra Deck Revisions (using {data.usage.revisions}
			; base quota is {data.quotaDetails.baseQuota.revisions})</span>
		<input name="extraRevisions" bind:value={data.quotaDetails.extraQuota.revisions} class="block w-full" required
		       type="number" min="0"
		       disabled={!data.localUser.isAdmin}/>
	</label>
	<label>
		<span>Quota of extra Sessions (using {data.usage.sessions}; base quota is {data.quotaDetails.baseQuota.sessions}
			)</span>
		<input name="extraSessions" bind:value={data.quotaDetails.extraQuota.sessions} class="block w-full" required
		       type="number" min="0"
		       disabled={!data.localUser.isAdmin}/>
	</label>
	<label>
		<span>Quota of extra Snapshots (using {data.usage.snapshots}
			; base quota is {data.quotaDetails.baseQuota.snapshots})</span>
		<input name="extraSnapshots" bind:value={data.quotaDetails.extraQuota.snapshots} class="block w-full" required
		       type="number" min="0"
		       disabled={!data.localUser.isAdmin}/>
	</label>
	<label>
		<span>Quota of extra Analyses (using {data.usage.analyses}; base quota is {data.quotaDetails.baseQuota.analyses}
			)</span>
		<input name="extraAnalyses" bind:value={data.quotaDetails.extraQuota.analyses} class="block w-full" required
		       type="number" min="0"
		       disabled={!data.localUser.isAdmin}/>
	</label>
	<label>
		<span>Quota of extra File Space (using {data.usage.diskSizeK}
			KB; base quota is {data.quotaDetails.baseQuota.diskSizeK})</span>
		<input name="extraDiskSizeK" bind:value={data.quotaDetails.extraQuota.diskSizeK} class="block w-full" required
		       type="number" min="0"
		       disabled={!data.localUser.isAdmin}/>
	</label>

	<ConfirmDialog
			cancelTitle="Cancel"
			confirmTitle="Delete"
			let:confirm="{confirmThis}"
			title="Delete User Account and ALL Data? (Cannot be undone!)">
		<button class="button-delete button m-2" on:click={() => confirmThis(deleteUser)}>
			<img alt="" class="w-4 mr-1" src="{base}/icons/delete.svg"/>Delete User and ALL User Data
		</button>
	</ConfirmDialog>

</form>