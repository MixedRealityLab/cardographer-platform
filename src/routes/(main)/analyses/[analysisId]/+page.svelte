<script lang="ts">
	import {enhance} from "$app/forms";
	import UserSelect from "$lib/ui/UserSelect.svelte"
	import type {ActionData} from "./$types"
	import AnalysisHeader from "./AnalysisHeader.svelte";
	import type {PageData} from './$types'

	export let data: PageData
	export let form: ActionData

	let error = ''
</script>

<AnalysisHeader analysis={data.analysis} />

<div class="p-6">
	<form class="flex flex-col text-sm gap-4" method="post" use:enhance>
		<label>
			<span class="font-light">Analysis name</span>
			<input name="name" bind:value="{data.analysis.name}" class="mt-1 block w-full" required type="text"/>
		</label>
		<label>
			<span class="font-light">Description</span>
			<textarea name="description" bind:value="{data.analysis.description}" class="mt-1 block w-full" rows="3"></textarea>
		</label>
		<label>
			<span class="font-light">Credits</span>
			<input name="credits" bind:value="{data.analysis.credits}" class="mt-1 block w-full" type="text"/>
		</label>
		<UserSelect bind:owners={data.analysis.owners} users={data.users}/>
		<div class="py-1">
			<label class="flex justify-center items-center">
				<input name="isPublic" bind:checked="{data.analysis.isPublic}" class="form-checkbox" type="checkbox" disabled={!data.localUser?.isPublisher}>
				<span class="ml-2">Public</span>
			</label>
		</div>

		{#if error}
			<div class="message-error">{error}</div>
		{/if}

		<div class="self-center mt-2 flex items-center">
			<svg class="h-6 w-6 mx-4 transition-opacity text-green-700 duration-500" class:opacity-0={!form?.success} fill="currentColor"
			     viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
				<path clip-rule="evenodd"
				      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
				      fill-rule="evenodd"/>
			</svg>

			<input class="button" type='submit' value='Save'>
			<div class="w-14"></div>
		</div>
	</form>
</div>
