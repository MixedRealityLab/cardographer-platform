<script lang="ts">
    export let zones: string[]
    export let zone: string
    $: zone = zones.indexOf(zone)>=0 ? zone : (zones.length>0 ? zones[0] : '')
</script>

<style>
    .arrow {
        @apply cursor-pointer text-gray-900;
    }
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

    .arrow.disabled {
        @apply cursor-default text-gray-400;
    }

    .arrow:hover:not(.disabled) {
        @apply text-gray-600;
    }
</style>

<div class="w-full py-1 px-2 bg-gray-300 text-gray-900 text-xl flex items-center">
    <div class="flex justify-center arrow" class:disabled={zones.indexOf(zone)<=0}
    class:highlight={!(zones.indexOf(zone)<=0)} 
    on:click={()=>{if(!(zones.indexOf(zone)<=0)) {zone=zones[zones.indexOf(zone)-1]}}}>
        <span class="text-xl mx-2">&lt;</span>
    </div>
    <div class="flex justify-center text-ellipsis grow">
        {zone}
    </div>
    <div class="flex justify-center arrow" class:disabled={zones.indexOf(zone)+1>=zones.length} 
        on:click={()=>{if(!(zones.indexOf(zone)+1>=zones.length)) {zone=zones[zones.indexOf(zone)+1]}}}>
        <span class="text-xl mx-2">&gt;</span>
    </div>
</div>