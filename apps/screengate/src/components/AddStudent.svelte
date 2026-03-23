<script>
import * as FilePond from 'filepond';
import 'filepond/dist/filepond.min.css';
  import { setClient, mutate, query } from "svelte-apollo";
  import { client } from "../routes/_apollo";
  import { ADD_STUDENT } from "../routes/_queries";
    import { ALL_BIO } from "../routes/_queries";
  import { GET_GRADES } from "../routes/_queries";
  import { onMount } from "svelte";
  import { schema } from "./validate";






  const rows = query(client, {
    query: ALL_BIO
  });

  // Component Variables

  let validity = [],
        contact_validity = [],
          errors = [],
           contact_errors = [],
            valid = false,
               contact_valid = false;

  let idn,
        name,
         position,
          contact_name,
            contact_phone;

  let selected,
        grade_selected,
         prev,
          force = true,
            init = true;

  let answer = "";

  let contacts = [
    {
      relation: `Mother`,
      dom_class: "",
      valid: false,
      touched: false,
      full_name: "",
      phone_number: ""
    },
    {
      relation: `Father`,
      dom_class: "",
      valid: false,
      touched: false,
      full_name: "",
      phone_number: ""
    },
    {
      relation: `Guardian`,
      dom_class: "",
      valid: false,
      touched: false,
      full_name: "",
      phone_number: ""
    }
  ];

  // VALIDATION

  let form = new schema({
    idn: { type: "string", min: 3, max: 255 },
    name: { type: "string", min: 3, max: 255 },
    grade_selected: { type: "number" }
  });

  let contact_form = new schema({
    contact_name: { type: "string", min: 3, max: 255 },
    contact_phone: { type: "string", min: 3, max: 255 }
  });

FilePond.registerPlugin(
  FilePondPluginFileEncode,
  FilePondPluginFileValidateType,
  FilePondPluginImageExifOrientation,
  FilePondPluginImagePreview,
  FilePondPluginImageCrop,
  FilePondPluginImageResize,
  FilePondPluginImageTransform
);

FilePond.create(
	document.querySelector('input[type="file"]'),
	{
		labelIdle: `Drag & Drop your picture or <span class="filepond--label-action">Browse</span>`,
    imagePreviewHeight: 170,
    imageCropAspectRatio: '1:1',
    imageResizeTargetWidth: 200,
    imageResizeTargetHeight: 200,
    stylePanelLayout: 'compact circle',
    styleLoadIndicatorPosition: 'center bottom',
    styleButtonRemoveItemPosition: 'center bottom'
	}
);



  onMount(async () => {
    setClient(client);




  });
  const grades = query(client, {
    query: GET_GRADES
  });

  // CUSTOM Functions
  String.prototype.isEmpty = function() {return (this.length === 0 || !this.trim());};
  
  function clearset(selected) {
    force = false;
    setTimeout(() => {
      force = true;
    }, 10);
    if (selected) {
      selected.dom_class = "text-orange-500";

      if (init) {
        prev = selected;
        init = false;
      } else {

        
        if (!contact_name&&!contact_phone)
        {
          prev.dom_class = "text-gray-400";
          prev.valid = false;
        } else {
          contact_validate();
          prev.touched= true;
          prev.full_name = contact_name
          prev.phone_number = contact_phone;
 
          if (contact_valid) {
            prev.dom_class = "text-green-400";
            prev.valid = true;
          } else {
            prev.dom_class = "text-red-400";
            prev.valid = false;
          }
        }
        prev = selected;
        selected.full_name;
        contact_name = selected.full_name;
        contact_phone = selected.phone_number;
        selected.touched ? contact_validate():null;

        
  
      }
    }
  }

  function contact_validate() {
    let { v, a, l } = contact_form.validate({ contact_name, contact_phone });
    contact_errors = v;
    contact_validity = a;
    contact_valid = l;
  }

  function form_validate() {
    let { v, a, l } = form.validate({ idn, name, grade_selected });
    errors = v;
    validity = a;
    valid = l;
  }

  function reset_input(){
        valid = false;
        idn = "";
        name = "";
        document.getElementById("grade").value = "";
        contact_name = ""
        contact_phone =""
        contacts.forEach((el)=>{el.dom_class = "";})
        contacts.forEach((el)=>{el.valid = false;})
        contacts.forEach((el)=>{el.touched = false;})
        contacts.forEach((el)=>{el.full_name = "";})
        contacts.forEach((el)=>{el.phone_number = "";})
        force = false;
    setTimeout(() => {force = true;}, 10);
     init = true;
  }

  async function addTeacher(e) {
    e.preventDefault();

    form_validate();
    clearset(selected);
    let sort_contacts = [...contacts];
    sort_contacts = sort_contacts.filter(contac => contac.valid === true);
    const pick = (obj, ...args) => ({
      ...args.reduce((res, key) => ({ ...res, [key]: obj[key] }), {})
    });
    sort_contacts = sort_contacts.map(details => {
      return pick(details,"relation", "full_name", "phone_number");
    });

    console.log(sort_contacts);

    let student = {
      data: {
        id_number: idn,
        full_name: name,
        students: { data: { grade_id: grade_selected } },
        contacts: { data: sort_contacts }
      }
    };

    if (valid == true) {
      try {
        // show loading
        console.log("rat-trying");
        await mutate(client, {
          mutation: ADD_STUDENT,
          variables: student
        });
        console.log("RAT-succes");
        reset_input()
            rows.refetch();
      } catch (error) {
        alert("Bugo");
        console.log(error);
      }
    }
  }
</script>

<style>

.filepond--drop-label {
	color: #4c4e53;
}

.filepond--label-action {
	text-decoration-color: #babdc0;
}

.filepond--panel-root {
	background-color: #edf0f4;
}


/**
 * Page Styles
 */

.filepond--root {
	width:170px;
	margin: 0 auto;
}


</style>

<div class="shadow-xl p-10 bg-white max-w-xl rounded">

  <p class="text-3xl font-black mb-4 ">Student Info</p>

  <input type="file" 
       class="filepond"
       name="filepond"
       accept="image/png, image/jpeg, image/gif"/>


  <form on:submit={addTeacher}>

    <div class="flex items-center border-b border-b-2 border-teal-500 py-2">
      <p class="w-1/5 text-xs">ID-Num :</p>
      <input
        class=" w-3/5 appearance-none bg-transparent border-none text-gray-700
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
        class=" w-3/5 appearance-none bg-transparent border-none text-gray-700
        mr-6 py-1 px-2 leading-tight focus:outline-none"
        placeholder="Full name"
        bind:value={name} />
      {#if validity.includes('name')}
        <p class="w-1/5 text-pink-600 text-xs italic">
          {errors.where('name').message}
        </p>
      {/if}
    </div>

    <div class="flex items-center border-b border-b-2 border-teal-500 py-2 ">
      <p class="w-1/5 text-xs">Grade :</p>
      <div class="relative">
        <select
          id= "grade"
          bind:value={grade_selected}
          class="block appearance-none w-full bg-transparent text-gray-500 mr-6
          py-1 px-2 rounded leading-tight focus:outline-none">
          <option value="" hidden>Choose Grade</option>

          {#await $grades}
            Loading...
          {:then result}
            {#each result.data.grade as grade}
              <option value={grade.id}>{grade.name}</option>
            {/each}
          {:catch error}
            Error: {error}
          {/await}
        </select>
        <div
          class="pointer-events-none absolute inset-y-0 right-0 flex
          items-center px-2 text-gray-700">
          <svg
            class="fill-current h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20">
            <path
              d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757
              6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
    <div class="mb-8" />


    <div class="flex relative items-center py-2">
      <div class="w-1/6 ">
        <p class="absolute my-auto text-xs" style="bottom:28%">Contacts :</p>
      </div>
      <div class="relative">
        <div
          class="block relative appearance-none w-full bg-transparent
          text-gray-400 mr-6 py-1 px-2 rounded leading-tight focus:outline-none">
          <p class="inline invisible" style="font-size:0.01rem">.</p>

          {#if force}
            {#each contacts as contact}
              <p class="{selected ? contact.dom_class : ''} inline">
                {contact.relation}
              </p>
              -
            {/each}
            <select
              bind:value={selected}
              on:change={() => clearset(selected)}
              class="block absolute top-0 left-0 appearance-none w-full
              bg-transparent text-transparent rounded leading-tight
              focus:outline-none">
              <option value="" hidden>Contact Relations</option>
              {#each contacts as contact}
                <option class="text-gray-800" value={contact}>
                  {contact.relation}
                </option>
              {/each}

            </select>                         

            <div
              class="pointer-events-none absolute inset-y-0 right-0 flex
              items-center px-2 text-gray-700">
              <svg
                class="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20">
                <path
                  d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757
                  6.586 4.343 8z" />
              </svg>
            </div>
          {/if}
        </div>

      </div>

    </div>
    <div class="border-b border-b-2 border-orange-400" />
    <div class="flex items-center border-b border-b-2 border-orange-500 py-2 ">

      <p class="w-1/5 text-xs">Name :</p>
      <input
        class="
        {!selected ? 'pointer-events-none' : ''} w-3/5 appearance-none
        bg-transparent border-none placeholder-gray-400 mr-6 py-1 px-2
        leading-tight focus:outline-none"
        placeholder="Full name"
        bind:value={contact_name} />
      {#if contact_validity.includes('contact_name')&& selected.touched}
        <p class="w-1/5 text-pink-600 text-xs italic">
        {#if !!contact_name}
          {contact_errors.where('contact_name').message}
          {:else}
          **required**
        {/if}
        </p>
      {/if}
    </div>

    <div class="flex items-center border-b border-b-2 border-orange-500 py-2 ">

      <p class="w-1/5 text-xs">Phone :</p>
      <input
        class="
        {!selected ? 'pointer-events-none' : ''} w-3/5 appearance-none
        bg-transparent border-none placeholder-gray-400 mr-6 py-1 px-2
        leading-tight focus:outline-none"
        placeholder="Contact Number"
        bind:value={contact_phone} />

      {#if contact_validity.includes('contact_phone') && selected.touched}
        <p class="w-1/5 text-pink-600 text-xs italic">
        {#if !!contact_phone}
          {contact_errors.where('contact_phone').message}
          {:else}
          **required**
        {/if}
        </p>
      {/if}
    </div>

    <button
      class="{valid ? 'is-loading' : ''} bg-indigo-600 hover:bg-blue-dark
      text-white font-bold py-3 px-6 mt-8 rounded relative "
      type="submit">
      Add Student
    </button>
  </form>
</div>
