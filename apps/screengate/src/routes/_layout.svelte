<script>
	//import Nav from '../components/Nav.svelte';
	//export let segment;
 // import "bulma/css/bulma.css";
 import "@loadingio/loading.css/dist/loading.min.css"
  import Tailwindcss from '../Tailwindcss.svelte';
</script>

<!--
<Nav {segment}/>
-->
<link rel="stylesheet" type="text/css" href="https://unpkg.com/tailwindcss@1.1.4/dist/tailwind.css">
<Tailwindcss />

<main>

	<slot></slot>
</main>