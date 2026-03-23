<script>
  import Nav from "../components/Nav.svelte";
  import Menu from "../components/Menu.svelte";
  import AllScans from "../components/All_Scans.svelte";
</script>

<main>
  <body class="bg-gray-900 font-sans leading-normal tracking-normal mt-12">
    <Nav />
    <div class="flex flex-col md:flex-row">
      <Menu />
      <div class="main-content flex-1 bg-gray-100 mt-12 md:mt-2 pb-24 md:pb-5">
        <div class="flex flex-wrap">

          <div class="w-full md:w-1/2 xl:w-full p-3 ">
            <AllScans />
          </div>
        </div>
      </div>

    </div>
  </body>
</main>
