<script>
  import moment from "moment";
  import Stable from "./Stable.svelte";
    import { setClient, subscribe } from "svelte-apollo";
  import { client } from "../routes/_apollo";
import { ALL_SCANS } from "../routes/_queries";
import { onMount } from "svelte";





  onMount(async () => {
    setClient(client);
  });


  const rows = subscribe(client, {
    query: ALL_SCANS
  });

const columns = [
  {
    key: "id_number",
    title: "ID NUMBER",
    value: v => v.bio.id_number,
    sortable: false,
    headerClass: "text-left w-1/5"
  },
  {
    key: "full_name",
    title: "NAME",
    value: v => v.bio.full_name,
    sortable: true,
  },
   {
    key: "created_at",
    title: "TIME",
    value: v => moment(v.bio.created_at).format('LT'),
    sortable: true,
  },
];

//moment(v.bio.created_at,'LT').format('LT')
</script>


<div class="shadow-xl p-10 bg-white w-full rounded">


  {#await $rows}
    Loading...
  {:then result}
    <Stable columns="{columns}" rows="{result.data.scan_bio}" />
  {:catch error}
    Error: {error}
  {/await}

</div>