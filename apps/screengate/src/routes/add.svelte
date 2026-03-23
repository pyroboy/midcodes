<script>
  import Nav from "../components/Nav.svelte";
  import Menu from "../components/Menu.svelte";
  import AddEmployee from "../components/AddEmployee.svelte";
  import AddStudent from "../components/AddStudent.svelte";
  import AddGrade from "../components/AddGrade.svelte";
  import Table from "../components/Table.svelte";
</script>

<main>
  <body class="bg-gray-900 font-sans leading-normal tracking-normal mt-12">
    <Nav />
    <div class="flex flex-col md:flex-row">
      <Menu />
      <div class="main-content flex-1 bg-gray-100 mt-12 md:mt-2 pb-24 md:pb-5">
        <div class="flex flex-wrap">

          <div class="w-full md:w-1/2 xl:w-1/3 p-3">
            <AddStudent />
            <AddEmployee />
            <AddGrade />
          </div>
          <div class="w-full md:w-1/2 xl:w-2/3 p-3 ">
            <Table />
          </div>
        </div>
      </div>

    </div>
  </body>
</main>
