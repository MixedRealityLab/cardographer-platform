<script lang="ts">
	import {enhance} from "$app/forms";
	import type {User} from "$lib/types"
	import {base} from '$app/paths'
	import {page} from "$app/stores";
	import type {CardDeckRevision} from "$lib/types"
	import AppBar from "$lib/ui/AppBar.svelte"
	import Tab from "$lib/ui/Tab.svelte"

	let {email} = $page.params

	export let data

	let error = ''
	let message = ''
</script>

<AppBar back="{base}/users" subtitle="User">
	<Tab url="{base}/users/{email}">
		Details
	</Tab>
</AppBar>

<div class="subheader">
	<div class="flex-1">
		<div class="block inline-flex items-center gap-2">{data.user.name}
				<span class="opacity-50">&lt;{data.user.email}&gt;</span>
		</div>
	</div>
</div>

<form class="p-6 flex flex-col gap-4" method="post" use:enhance>
	<label>
		<span>Name</span>
		<input name="userName" bind:value={data.user.name} class="block w-full" required type="text"
		       />
	</label>
	<label>
		<span>Email</span>
		<input name="userEmail" bind:value={data.user.email} class="block w-full" required type="text"
		       disabled=true/>
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
			<input name="isVefified" bind:checked={data.user.isVerified} class="form-checkbox" type="checkbox"
			       disabled=true>
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
		<span>Quota of extra Decks (base quota is {data.quotaDetails.baseQuota.decks})</span>
		<input name="extraDecks" bind:value={data.quotaDetails.extraQuota.decks} class="block w-full" required type="number" min="0"
		       disabled={!data.localUser.isAdmin}/>
	</label>
	<label>
		<span>Quota of extra Deck Revisions (base quota is {data.quotaDetails.baseQuota.revisions})</span>
		<input name="extraRevisions" bind:value={data.quotaDetails.extraQuota.revisions} class="block w-full" required type="number" min="0"
		       disabled={!data.localUser.isAdmin}/>
	</label>
	<label>
		<span>Quota of extra Sessions (base quota is {data.quotaDetails.baseQuota.sessions})</span>
		<input name="extraSessions" bind:value={data.quotaDetails.extraQuota.sessions} class="block w-full" required type="number" min="0"
		       disabled={!data.localUser.isAdmin}/>
	</label>
	<label>
		<span>Quota of extra Snapshots (base quota is {data.quotaDetails.baseQuota.snapshots})</span>
		<input name="extraSnapshots" bind:value={data.quotaDetails.extraQuota.snapshots} class="block w-full" required type="number" min="0"
		       disabled={!data.localUser.isAdmin}/>
	</label>
	<label>
		<span>Quota of extra Analyses (base quota is {data.quotaDetails.baseQuota.analyses})</span>
		<input name="extraAnalyses" bind:value={data.quotaDetails.extraQuota.analyses} class="block w-full" required type="number" min="0"
		       disabled={!data.localUser.isAdmin}/>
	</label>
	<label>
		<span>Quota of extra File Space (base quota is {data.quotaDetails.baseQuota.diskSizeK})</span>
		<input name="extraDiskSizeK" bind:value={data.quotaDetails.extraQuota.diskSizeK} class="block w-full" required type="number" min="0"
		       disabled={!data.localUser.isAdmin}/>
	</label>

</form>