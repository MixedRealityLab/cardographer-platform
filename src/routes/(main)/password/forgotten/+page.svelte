<script lang="ts">
	import {enhance} from "$app/forms";
	import {base} from '$app/paths'
	import AppBar from "$lib/ui/AppBar.svelte";

	let error = ''
	let working = false
	let reset = false
</script>

<AppBar back="{base}/"/>

<div class="p-12 max-w-md mx-auto">
	<form method="post"  use:enhance={() => {
		working = true
		return async ({ result, update }) => {
			working = false
			reset = true
			update()
	    };
	}}>
		<div class="flex flex-col gap-8">
			<label>
				<span>Email</span>
				<!--suppress HtmlWrongAttributeValue -->
				<input name="email" disabled={working || reset} class="w-full" required type="email"/>
			</label>

			{#if error}
				<div class="message-error">{error}</div>
			{/if}
			{#if reset}
				<div class="message-success">An email has been sent to the above account</div>
			{/if}
			<!--suppress HtmlWrongAttributeValue -->
			<input class="button self-center" disabled={working || reset} type='submit' value='Reset Password'>
		</div>
	</form>
</div>