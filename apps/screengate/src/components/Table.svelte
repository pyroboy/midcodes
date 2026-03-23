<script>
  import Stable from "./Stable.svelte";
    import { setClient, query } from "svelte-apollo";
  import { client } from "../routes/_apollo";
import { ALL_BIO } from "../routes/_queries";
import { onMount } from "svelte";
  onMount(async () => {
    setClient(client);
  });


  const rows = query(client, {
    query: ALL_BIO
  });

const columns = [
  {
    key: "id_number",
    title: "ID NUMBER",
    value: v => v.id_number,
    sortable: false,
    headerClass: "text-left w-1/5"
  },
  {
    key: "full_name",
    title: "NAME",
    value: v => v.full_name,
    sortable: true,
  },
 
];
</script>


<div class="shadow-xl p-10 bg-white w-full rounded">

  {#await $rows}
    Loading...
  {:then result}
    <Stable columns="{columns}" rows="{result.data.bio}" />
  {:catch error}
    Error: {error}
  {/await}

</div>