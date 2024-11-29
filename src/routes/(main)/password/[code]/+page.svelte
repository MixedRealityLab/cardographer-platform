<script lang="ts">
	import {base} from '$app/paths'
	import {page} from '$app/stores'
	import {enhance} from "$app/forms";
	import AppBar from "$lib/ui/AppBar.svelte"

	let error = ''
	let working = false
	let success = false

</script>

<AppBar back="{base}/"/>

<div class="p-12 max-w-md mx-auto">
	<form method="post"   use:enhance={() => {
		working = true
		return async ({ result, update }) => {
			success = result.type == "success"
			if (result.type != "success") {
				error = "Sorry, perhaps it is the wrong code or too old"
			}
			update()
	    };
	}}>
		<div class="flex flex-col gap-8">
			<label>
				<span>New Password</span>
				<!--suppress HtmlWrongAttributeValue -->
				<input name="password" class="w-full" disabled={working || success} required type="password" autocomplete="new-password"/>
			</label>

			{#if error}
				<div class="message-error">{error}</div>
			{:else if success}
				<a class="message-success" href="{base}/">
					Password Changed. You should now be able to login again
				</a>
			{/if}

			<!--suppress HtmlWrongAttributeValue -->
			<input class="button self-center" disabled={working || success} type='submit' value='Set New Password'>
		</div>
	</form>
</div>