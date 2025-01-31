<script lang="ts">
	import {base} from "$app/paths";
	import {formatDate} from "$lib/ui/formatutils"
	import UserTabs from '$lib/ui/UserTabs.svelte'
	import type {PageData} from './$types'

	export let data: PageData

	let search = ""
</script>

<UserTabs user={data.localUser}/>

<div class="w-full flex flex-col mb-4 text-sm font-medium p-6 gap-4">
	<input name="search" placeholder="Email" class="block w-full" type="text" bind:value="{search}">
	{#if data.users}
		{#each data.users.filter((user) => search.length === 0 || user.email.indexOf(search) >= 0) as user}
			<a class="listItem" class:bg-gray-100={user.email === data.localUser.email}
			   href="{base}/users/{user.email}">
				<img src="{base}/icons/person.svg" class="w-6 mr-4" alt=""/>
				<div class="flex flex-1 flex-col">
					<div class="flex">
						<div class="flex-1 flex items-center gap-1">
							<span class="font-semibold">{user.name}</span> <span class="text-gray-600">&lt;{user.email}
							&gt;</span>
						</div>
					</div>
					<div class="flex">
						<div class="flex-1 flex items-center gap-1">
							{#if user.disabled}
								<div class="chip">Disabled</div>
							{/if}
							{#if user.isVerified}
								<div class="chip">Verified</div>
							{/if}
							{#if user.isAdmin}
								<div class="chip">Admin</div>
							{/if}
							{#if user.isPublisher}
								<div class="chip">Publisher</div>
							{/if}
							{#if user.isDeckBuilder}
								<div class="chip">DeckBuilder</div>
							{/if}
						</div>
						<div class="text-xs font-light text-gray-600">{formatDate(user.created)}</div>
					</div>
				</div>
			</a>
		{:else}
			<div class="self-center">No Users Found</div>
		{/each}
	{/if}
	<div class="self-center flex">
		<form method="post" action="{base}/logout">
			<!--suppress HtmlWrongAttributeValue -->
			<input class="button m-3" type='submit' value='Log out'>
		</form>
		{#if data.localUser.isAdmin}
			<a class="button m-3" href="{base}/audit.csv">
				<img src="{base}/icons/download.svg" alt="" class="w-3.5 mr-1"/>Check DB and Audit
			</a>
			<a class="button m-3" href="{base}/audit.csv?fix">
				<img src="{base}/icons/download.svg" alt="" class="w-3.5 mr-1"/>Fix DB and Audit
			</a>
		{/if}

	</div>

</div>
