<script lang="ts">
	import {slide} from 'svelte/transition'

	export let owners: string[] = []
	export let users = []
	export let name = "owners"

	let userFilter = ""
	let filtered = []

	function filter() {
		if (userFilter) {
			const filterValue = userFilter.toLowerCase()
			filtered = users
				.filter((user) => owners.indexOf(user.email) === -1)
				.filter((user) => (user.name && user.name.toLowerCase().indexOf(filterValue) > -1) || user.email.toLowerCase().indexOf(filterValue) > -1)
				.slice(0, 5)
		} else {
			filtered = []
		}
	}

	function addUser(email: string) {
		owners = [...owners, email]
		userFilter = ""
		filter() 
	}

	function getUsername(email: string): string {
		const user = users.find((user) => user.email === email)
		if (user && user.name) {
			return user.name
		}
		return email
	}
</script>

<label class="relative" for="userFilter">
	<span class="font-light">Owners</span>
	<div class="input flex flex-wrap items-center gap-3">
		{#each owners as owner}
			<div class="flex items-center rounded-full bg-gray-200">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mx-2 my-1" viewBox="0 0 20 20"
				     fill="currentColor">
					<path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
					      clip-rule="evenodd"/>
				</svg>
				<span class="mr-2">{getUsername(owner)}</span>
				{#if owners.length > 1}
					<button type="button" aria-label="Remove"
					        on:click|preventDefault={() => owners = owners.filter((item) => item !== owner)}
					        class="p-2 transition-colors duration-500 text-gray-400 hover:text-blue-700">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20"
						     fill="currentColor">
							<path fill-rule="evenodd"
							      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							      clip-rule="evenodd"/>
						</svg>
					</button>
				{/if}
			</div>
		{/each}
		<div class="flex-1">
			<input bind:value={userFilter}
			       class="bg-transparent w-full border-0 focus:outline-none focus:shadow-none focus:ring-0 outline-none focus-within:bg-transparent"
			       id="userFilter" 
				   on:blur={()=>{/* todo fix race with click: filtered=[]*/}}  
				   on:focus={filter} on:input={filter}/>
		</div>
	</div>
	{#each owners as owner}
		<input name="{name}" type="hidden" value="{owner}"/>
	{/each}

	{#if filtered.length > 0}
		<div transition:slide class="absolute bg-white drop-shadow border-gray-200 flex flex-col items-stretch">
			{#each filtered as user}
				<button class="px-4 py-2 hover:bg-blue-300 focus:bg-blue-300 text-left flex items-center"
				        on:click|preventDefault={() => addUser(user.email)}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 20 20"
					     fill="currentColor">
						<path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
					</svg>
					{user.name || user.email}
				</button>
			{/each}
		</div>
	{/if}
</label>