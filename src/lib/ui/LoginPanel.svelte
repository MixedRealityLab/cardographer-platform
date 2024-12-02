<script lang="ts">
	import {base} from "$app/paths";

	export let register = false

	export let error: string = null
	export let success: string = null
</script>

<div class="flex flex-col gap-8 max-w-md mx-auto">
	{#if register}
		<label>
			<span>Name</span>
			<input class="w-full" required name="name" type="text" autocomplete="name"/>
		</label>
		<input type="hidden" name="register" value="true"/>
	{/if}
	<label>
		<span>Email</span>
		<input class="w-full" name="email" required type="text" autocomplete="username"/>
	</label>
	{#if !register}
	<label>
		<span>Password</span>
		<input class="w-full" name="password" required type="password"
		       autocomplete={register ? "new-password" : "current-password"}/>
		{#if !register}
			<div class="flex text-sm justify-center text-gray-700">
				<a href="{base}/password/forgotten" class="hover:underline">forgot password</a>
			</div>
		{/if}
	</label>
	{/if}
	{#if register}
		<label>
			<span>Registration code</span>
			<input class="w-full" name="code" required type="password"/>
		</label>
	{/if}

	<div class="self-center flex flex-col gap-2">
		{#if error}
			<div class="message-error">{error}</div>
		{/if}
		{#if success}
			<div class="message-success">{success}</div>
		{/if}
		<input class="button self-center" type='submit' value='{register ? "Register" : "Log in"}'>
	</div>
</div>