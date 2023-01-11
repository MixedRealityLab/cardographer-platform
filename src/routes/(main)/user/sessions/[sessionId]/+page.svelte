<script lang="ts">
	import {enhance} from "$app/forms";
	import UserSelect from "$lib/ui/UserSelect.svelte"
	import type {ActionData} from "./$types"

	export let data
	export let form: ActionData

	let error = ''
</script>

<form class="p-6 flex flex-col text-sm gap-4" method="post" use:enhance>
	<label>
		<span class="font-light">Session name</span>
		<input name="name" bind:value="{data.session.name}" class="mt-1 block w-full" required type="text"/>
	</label>
	<label>
		<span class="font-light">Description</span>
		<textarea name="description" bind:value="{data.session.description}" class="mt-1 block w-full" rows="3"
		          type="text"></textarea>
	</label>
	<label>
		<span class="font-light">Credits</span>
		<input name="credits" bind:value="{data.session.credits}" class="mt-1 block w-full" type="text"/>
	</label>
	<UserSelect bind:owners={data.session.owners} name="owners" users={data.users}/>

	<div class="flex justify-center gap-4">
		<label class="flex items-center">
			<input name="isPublic" bind:checked="{data.session.isPublic}" class="form-checkbox" type="checkbox">
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