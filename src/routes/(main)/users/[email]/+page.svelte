<script lang="ts">
	import {enhance} from "$app/forms";
	import type {User} from "$lib/types"

	export let data: User

	let error = ''
	let message = ''
</script>

<div class="subheader">
	<div class="flex-1">
		<div class="block inline-flex items-center gap-2">{data.name}
				<span class="opacity-50">&lt;{data.email}&gt;</span>
		</div>
	</div>
</div>

<form class="p-6 flex flex-col gap-4" method="post" use:enhance>
	<label>
		<span>Name</span>
		<input name="userName" bind:value={data.name} class="block w-full" required type="text"
		       />
	</label>
	<label>
		<span>Email</span>
		<input name="userEmail" bind:value={data.email} class="block w-full" required type="text"
		       disabled=true/>
	</label>
	<div>
		<span class="text-sm text-gray-800">Created</span>
		<div class="px-3">{new Date(data.created).toLocaleString('en-gb', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		})}</div>
	</div>
	<div class="flex flex-wrap justify-center gap-4 py-1">
		<label class="flex items-center gap-2">
			<input name="isDisabled" bind:checked={data.disabled} class="form-checkbox" type="checkbox"
			       disabled={!data.localIsAdmin}>
			<span>Disabled</span>
		</label>
		<label class="flex items-center gap-2">
			<input name="isVefified" bind:checked={data.isVerified} class="form-checkbox" type="checkbox"
			       disabled=true>
			<span>Verified</span>
		</label>
		<label class="flex items-center gap-2">
			<input name="isDeckBuilder" bind:checked={data.isDeckBuilder} class="form-checkbox" type="checkbox"
			       disabled={!data.localIsAdmin}>
			<span>DeckBuilder</span>
		</label>
		<label class="flex items-center gap-2">
			<input name="isPublisher" bind:checked={data.isPublisher} class="form-checkbox" type="checkbox"
			       disabled={!data.localIsAdmin}>
			<span>Publisher</span>
		</label>
		<label class="flex items-center gap-2">
			<input name="isAdmin" bind:checked={data.isAdmin} class="form-checkbox" type="checkbox"
			       disabled={!data.localIsAdmin}>
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
</form>