<script lang="ts">
	import {createEventDispatcher} from "svelte";

	export let types = "*"
	export let multiple= false

	const dispatch = createEventDispatcher<{'upload': FileList}>()
	let files: FileList
	let fileInput: HTMLInputElement

	function handleSubmit() {
		if (files.length != 0) {
			dispatch("upload", files)
		}
	}
</script>

<input class="hidden" type="file" accept="{types}" multiple={multiple}
       bind:files bind:this={fileInput} on:change={handleSubmit}/>

<button class={$$props.class} on:click={() => fileInput.click()} title={$$props.title}>
	<slot></slot>
</button>