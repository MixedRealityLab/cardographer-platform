<script lang="ts">
	export let types = "*"
	export let multiple = false
	export let disabled = false

	let fileInput: HTMLInputElement

	function handleSubmit() {
		if(fileInput.files.length != 0) {
			console.log(fileInput.files)
			fileInput.form.submit()
		}
	}
</script>

<input class="hidden" type="file" name="files" accept="{types}" multiple={multiple}
       bind:this={fileInput} on:change={handleSubmit}/>

<button class={$$props.class} on:click|preventDefault={() => fileInput.click()} title={$$props.title} disabled={disabled}>
	<slot></slot>
</button>