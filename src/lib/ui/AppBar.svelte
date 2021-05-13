<script>
  export let title;
  export let backpage;
</script>

<div class="w-full pt-1 pb-1 bg-gray-700 text-2xl text-white px-2">
{#if backpage}
  <div class="p-1 inline">
    <a href="{backpage}">&lt;</a>
  </div>
{/if}
  <div class="p-1 inline">{title}</div>
</div>
