<script lang="ts">
	import {enhance} from "$app/forms";
	import {base} from '$app/paths'
	import AppBar from "$lib/ui/AppBar.svelte";
	import type {ActionData} from './$types'

	let register = false

	export let form: ActionData
</script>

<style>
    .tab {
        @apply px-4 rounded-t py-1 cursor-pointer transition-colors duration-500 mx-0;
    }

    .tabSelected {
        @apply bg-gray-300 cursor-default text-gray-900;
    }

    .tab:hover:not(.tabSelected) {
        @apply bg-gray-500;
    }
</style>

<AppBar>
	<button class="tab" class:tabSelected="{!register}" on:click={() => register = false}>
		Login
	</button>
	<button class="tab" class:tabSelected="{register}" on:click={() => register = true}>
		Register
	</button>
</AppBar>

<div class="p-12 max-w-md mx-auto">
	<form method="post" use:enhance>
		<div class="flex flex-col gap-8">
			{#if register}
				<label>
					<span>Name</span>
					<input class="w-full" required name="name" type="text" autocomplete="name"/>
				</label>
				<input type="hidden" name="register" value="true" />
			{/if}
			<label>
				<span>Email</span>
				<input class="w-full" name="email" required type="text" autocomplete="username"/>
			</label>
			<label>
				<span>Password</span>
				<input class="w-full" name="password" required type="password"
				       autocomplete={register ? "new-password" : "current-password"}/>
				{#if !register}
					<div class="flex flex-col">
						<a href="{base}/user/password/forgotten"
						   class="text-sm self-center pt-2 text-gray-700 hover:underline">forgot password</a>
					</div>
				{/if}
			</label>

			{#if register}
				<label>
					<span>Registration code</span>
					<input class="w-full" name="code" required type="password"/>
				</label>
			{/if}

			{#if form && form.error}
				<div class="message-error">{form.error}</div>
			{/if}

			<input class="button self-center" type='submit' value='{register ? "Register" : "Log in"}'>
		</div>
	</form>
</div>