<script lang="ts">
	import {enhance} from "$app/forms";
	import {invalidateAll} from "$app/navigation";
	import {base} from '$app/paths'
	import type {SessionSnapshot} from "$lib/types";
	import SessionHeader from "../SessionHeader.svelte";
	import type {ActionData, PageData} from "./$types"
	import SnapshotItem from "./SnapshotItem.svelte";

	export let data: PageData
	export let form: ActionData
	let error = ''

	async function deleteSnapshot(snapshot: SessionSnapshot) {
		const res = await fetch(`${base}/snapshots/${snapshot._id}`, {
			method: 'DELETE'
		})
		if (res.ok) {
			//console.log(`deleted snapshot ${snapshot._id}`)
			await invalidateAll()
		}
	}

</script>

<SessionHeader session={data.session}/>

<div class="w-full flex flex-col mb-4 text-sm font-medium p-6 gap-4">
	{#if data.snapshots && data.snapshots.length > 0 }
		<form class="p-2 flex flex-col text-sm gap-2" method="post" use:enhance>
			{#each data.snapshots as snapshot}
				<SnapshotItem session={data.session} snapshot={snapshot}
				              on:delete={() => deleteSnapshot(snapshot)}/>
			{/each}
			{#if error}
				<div class="message-error">{error}</div>
			{/if}
			<div class="self-center mt-2 flex items-center">
				<svg class="h-6 w-6 mx-4 transition-opacity text-green-700 duration-500"
				     class:opacity-0={!form?.success}
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
	{:else}
		<div class="self-center">No Data Found</div>
	{/if}
</div>