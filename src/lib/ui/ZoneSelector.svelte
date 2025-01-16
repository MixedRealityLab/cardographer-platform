<script lang="ts">
	import {base} from "$app/paths"
    export let zones: string[]
    export let zone: string
    export let cards
    $: zone = zones.indexOf(zone)>=0 ? zone : (zones.length>0 ? zones[0] : '')
</script>

<style>
    .arrow {
        @apply cursor-pointer text-gray-900;
    }
/*
	@keyframes highlight {
		0% {
			outline: 2px ridge #24F8;
            @apply bg-gray-400;
        }
		25% {
			outline: 2px ridge #24F8;
            @apply bg-gray-400;
		}
		100% {
			outline: 2px ridge #24F0;
            @apply bg-gray-300;
		}
	}

	.highlight {
		animation: highlight 2s;
	}
*/
    .arrow.disabled {
        @apply cursor-default text-gray-400;
    }

    .arrow:hover:not(.disabled) {
        @apply text-gray-600;
    }
</style>

<div class="w-full py-1 px-2 bg-gray-100 text-gray-900 text-lg relative items-center h-10">
    {#if zones.length>1}
    <button aria-label="Left" class="absolute left-0 justify-center arrow" class:disabled={zones.indexOf(zone)<=0} 
    on:click={()=>{if(!(zones.indexOf(zone)<=0)) {zone=zones[zones.indexOf(zone)-1]}}}>
        <svg class="h-8 w-8" fill="currentColor" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" xml:space="preserve">
            <style type="text/css">.st0{fill:none;}</style>
            <path d="M15,6l-7,6l7,6V6z"/>
            <rect class="st0" width="24" height="24"/>
        </svg>
    </button>
    {/if}
    <div class="absolute left-10 right-10 align-center">
        <div class="w-full text-center overflow-hidden">
        {#if cards && cards.length>0}
        {cards.length}<img src="{base}/icons/deck.svg" class="inline h-5 align-center" alt=""/>
        {/if}
		{zone}
        </div>
    </div>
    {#if zones.length>1}
    <button aria-label="Right" class="absolute right-0 justify-center arrow" class:disabled={zones.indexOf(zone)+1>=zones.length} 
        on:click={()=>{if(!(zones.indexOf(zone)+1>=zones.length)) {zone=zones[zones.indexOf(zone)+1]}}}>
        <svg class="h-8 w-8" fill="currentColor" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" xml:space="preserve">
            <style type="text/css">.st0{fill:none;}</style>
            <path d="M9,18l7-6L9,6V18z"/>
            <rect class="st0" width="24" height="24"/>
        </svg>
    </button>
    {/if}
</div>