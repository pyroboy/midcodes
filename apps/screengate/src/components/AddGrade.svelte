<script>
  import { setClient, mutate, query } from "svelte-apollo";
  import { client } from "../routes/_apollo";
  import { ADD_GRADE } from "../routes/_queries";
  import { GET_GRADES } from "../routes/_queries";
  import { onMount } from "svelte";
  import { schema } from "./validate";

  // is this possible to be removed
  let validity = [],errors = [],valid = false;
  let name;

  onMount(async () => {
    setClient(client);
  });

  let form = new schema({
    name: { type: "string", min: 3, max: 255 }
  });

  const grades = query(client, {
    query: GET_GRADES
  });

  async function addTeacher(e) {
    e.preventDefault();

    let { v, a, l } = form.validate({ name });
    errors = v;validity = a;valid = l;

 
    if (valid == true) {
      try {
        // show loading
        await mutate(client, {
          mutation: ADD_GRADE,
          variables: { name }
        });
        grades.refetch();
        valid = false;
        name = "";
      } catch (error) {
        alert("Bugo");
        console.log(error);
      }
    }
  }
</script>


<div class="shadow-xl p-10 bg-white max-w-xl rounded">
  <form class="w-full max-w-sm" />
  <form on:submit={addTeacher} class="w-full max-w-sm">
    <div class="flex items-center border-b border-b-2 border-teal-500 py-2">
      <input
        class="appearance-none bg-transparent border-none w-full text-gray-700
        mr-3 py-1 px-2 leading-tight focus:outline-none"
        type="text"
        placeholder="Grade"
        bind:value={name} />

      {#if validity.includes('name')}
        <p class="w-full text-pink-600 text-xs italic">
          {errors.where('name').message}
        </p>
      {/if}
      <button
        class="{valid ? 'is-loading' : ''} relative flex-shrink-0 bg-indigo-600
        text-white h-10 h w-16 rounded"
        type="submit">
        <p class="text-xl font-black">+</p>
      </button>

    </div>

  </form>

  {#await $grades}
    Loading...
  {:then result}
    {#each result.data.grade as grade}
      {grade.name}
      <br />
    {/each}
  {:catch error}
    Error: {error}
  {/await}

</div>
