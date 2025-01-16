<script>
	import {fade, fly} from 'svelte/transition'

	export let title = 'Confirmation'
	export let confirmTitle = 'Confirm'
	export let cancelTitle = 'Cancel'

	let showDialog = false
	let functionToCall = {
		func: null,
		args: null
	}

	function callFunction(e) {
		e.preventDefault()
		showDialog = false
		functionToCall['func'](...functionToCall['args'])
	}

	function confirm(func, ...args) {
		functionToCall = {func, args}
		showDialog = true
	}
</script>

<slot confirm={confirm}></slot>

{#if showDialog}
	<button class="overlay" aria-label="Cancel" on:click="{(e) => { showDialog = false; e.preventDefault() } }"
	     on:keypress={(e) => { if(e.key === "Escape") { showDialog = false}}}
	     in:fade="{{ duration: 200 }}"
	     out:fade="{{ delay: 200, duration: 200 }}">
	</button>
	<div class="confirm-dialog" in:fly="{{
      y: -10,
      delay: 200,
      duration: 200
    }}" out:fly="{{
      y: -10,
      duration: 200
    }}"
	>
		<div class="message-title">
			<slot name="title">{title}</slot>
		</div>
		<div class="message-description">
			<slot name="description">
				Are you sure you wish to do this?
			</slot>
		</div>
		<div class="actions">
			<button class="button mx-4" on:click="{(e) => { showDialog = false; e.preventDefault() } }">
				{cancelTitle}
			</button>
			<button class="button button-delete" on:click="{callFunction}">
				{confirmTitle}
			</button>
		</div>
	</div>
{/if}

<style>
    .message-title {
        @apply font-bold text-xl pb-5;
    }

    .message-description {
        @apply font-normal;
    }

    .actions {
        @apply flex justify-end pt-5;
    }

    .confirm-dialog {
        @apply bg-white p-5 rounded absolute flex flex-col top-1/2 left-1/2;
        z-index: 999;
        transform: translate(-50%, -50%);
        max-width: 300px;
        width: calc(100% - 40px);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
    }

    .overlay {
        @apply left-0 top-0 w-full h-full fixed select-none;
        z-index: 998;
        background: hsla(0, 0%, 0%, 80%);
    }
</style>