<script>
  import { setClient, mutate ,query} from "svelte-apollo";
  import { client } from "../routes/_apollo";
  import { ADD_EMPLOYEE } from "../routes/_queries";
  import { ALL_BIO } from "../routes/_queries";
  import { onMount } from "svelte";
  import { schema } from "./validate";
  let validity = [],errors = [],valid = false;



  const rows = query(client, {
    query: ALL_BIO
  });

  let idn, name, position;

  onMount(async () => {
    setClient(client);
  });


  // $: idn, validate();

  let form = new schema({
    idn: { type: "string", min: 3, max: 255 },
    name: { type: "string", min: 3, max: 255 },
    position: { type: "string", min: 3, max: 255 }
  });



  async function addTeacher(e) {
    e.preventDefault();
    let { v, a, l } = form.validate({ idn,name,position });
    errors = v;validity = a;valid = l;

    if (valid == true) {
      try {
        // show loading
        await mutate(client, {
          mutation: ADD_EMPLOYEE,
          variables: { idn, position, name }
        });

        //alert("Added successfully");
        valid = false;
        idn = "";
        name = "";
        position = "";
          rows.refetch();
      } catch (error) {
        alert("Bugo");
        console.log(error);
      }
    }
  }
</script>

<style>

</style>

<div class="shadow-xl p-10 bg-white max-w-xl rounded">

 
  <p class="text-3xl font-black mb-4 ">Employee Info</p>
  <form on:submit={addTeacher}>

    <div class="flex items-center border-b border-b-2 border-teal-500 py-2">
    <p class="w-1/5 text-xs">ID-Num :</p> 
      <input
        class=" w-3/5 appearance-none bg-transparent border-none  text-gray-700
        mr-6 py-1 px-2 leading-tight focus:outline-none"
        placeholder="ID number"
        bind:value={idn} />
      {#if validity.includes('idn')}
        <p class="w-1/5 text-pink-600 text-xs italic">
          {errors.where('idn').message}
        </p>
      {/if}
    </div>

    <div class="flex items-center border-b border-b-2 border-teal-500 py-2">
    <p class="w-1/5 text-xs">Fullname :</p> 
      <input
        class=" w-3/5 appearance-none bg-transparent border-none  text-gray-700
        mr-6 py-1 px-2 leading-tight focus:outline-none"
        placeholder="Full name"
        bind:value={name} />
      {#if validity.includes('name')}
        <p class="w-1/5  text-pink-600 text-xs italic">
          {errors.where('name').message}
        </p>
      {/if}
    </div>
    <div class="flex items-center border-b border-b-2 border-teal-500 py-2 mb-8">
    <p class="w-1/5 text-xs">Position :</p> 
      <input
        class=" w-3/5 appearance-none bg-transparent border-none  text-gray-700
        mr-6 py-1 px-2 leading-tight focus:outline-none"
        placeholder="Position"
        bind:value={position} />

      {#if validity.includes('position')}
        <p class="w-1/5 text-pink-600 text-xs italic">
          {errors.where('position').message}
        </p>
      {/if}
    </div>
    <button
      class="{valid ? 'is-loading' : ''} bg-indigo-600 hover:bg-blue-dark text-white font-bold py-3 px-6
      rounded relative "
      type="submit">
      Add Employee
    </button>
  </form>
</div>
