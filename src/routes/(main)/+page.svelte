<script lang="ts">
	import {enhance} from "$app/forms"
	import AppBar from "$lib/ui/AppBar.svelte"
	import LoginPanel from "$lib/ui/LoginPanel.svelte"
	import type {ActionData} from "./$types";

	let register = false
	let working = false
	let registered = false

	export let form: ActionData
	export let data
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
	<form method="post" action="?/continueAsGuest" use:enhance>
		<input type="submit" class="tab" value="Guest (view)">
	</form>
</AppBar>
<div class="w-full bg-gray-300 font-semibold px-5 py-1.5 flex"></div>

<div class="p-12">
	<form method="post" action="?/login" use:enhance={() => {
		working = true
		return async ({ result, update }) => {
			working = false
			registered = register && result.type == "success"
			update()
	    };
	}}>
		<LoginPanel register={register} error={form ? form.error : null}
			success={registered ? "Please check your email to set your password." : null}
			needCode={data.needCodeToRegister}
			/>
	</form>
</div>
