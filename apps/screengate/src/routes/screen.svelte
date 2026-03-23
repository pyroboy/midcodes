<script>
  import moment from "moment";
  import { onMount } from "svelte";
  import { setClient, subscribe } from "svelte-apollo";
  import { client } from "./_apollo";
   import { NEW_SCANS , ANOMALY } from "./_queries";

  onMount(() => {
    setClient(client);
    const update = () => {
      var element = document.getElementById("now");
      if (typeof element != "undefined" && element != null) {
        document.getElementById("now").innerHTML = moment().format("h:mm:ss");
        document.getElementById("period").innerHTML = moment().format("A");
      }
    };
    setInterval(update, 100);
  });

  let genders = ["women", "men"];
  let gender = genders[Math.floor(Math.random() * 2)];
  let randomNumber = Math.floor(Math.random() * 80);

  const new_scans = subscribe(client, { query: NEW_SCANS });
  const anomaly = subscribe(client, { query: ANOMALY });
</script>

<div class="mx-auto bg-gray-700 h-screen flex items-center justify-center px-8">

  <div
    class="flex flex-col w-full bg-gray-100 rounded-lg shadow-lg sm:w-3/4
    md:w-1/2 lg:w-3/5 relative">
    <!-- <div class="bg-gray-600 w-full">

      <img
        class="h-16 w-16"
        src="https://i.pinimg.com/474x/a3/4e/ef/a34eef6b581ad41202b0abdeacddfb84--school-logo-random-thoughts.jpg"
        alt="" />
    </div> -->
    <div class="flex flex-col w-full md:flex-row">
  
      <div class="flex lg:w-1/3 md:w-full md:mx-auto shadow-md">
        <img
          class="rounded-lg w-64"
          src="https://randomuser.me/api/portraits/{gender}/{randomNumber}.jpg"
          alt="rat" />

      </div>
      <div class="flex content-center flex-col content-center w-full ml-3 pt-6">
        <div class=" ml-3">

          <h1 class="text-6xl text-gray-800 " style="margin-bottom:-.7rem">
          {#await $new_scans}
            Load.
            {:then result}
            {result.data.scan_bio[0].bio.full_name}
            {/await}
          </h1>
          <p class="w-full text-4xl pl-10 text-gray-700 pb-8">
           {#await $anomaly}
            Load.
            {:then result}
            {result.data.scan_anomaly[0].data}
            {/await}
          </p>
          <div class=" font-normal text-gray-800" />

        </div>
      </div>
    </div>

  </div>
  <div class="absolute left-0 bottom-0">
    <div class="text-4xl text-gray-600 py-2 px-6">
      OUT
      <p id="now" class="inline text-base" />
    </div>
  </div>
</div>
