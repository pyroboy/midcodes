<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { Text, OrbitControls } from '@threlte/extras';
	import { T } from '@threlte/core';

	// Font Sources to Test
	const fonts = {
		local: {
			roboto: '/fonts/Roboto-Regular.woff',
			montserrat: '/fonts/Montserrat-Regular.woff'
		},
		cdn: {
			roboto: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto/files/roboto-latin-400-normal.woff',
			montserrat: 'https://cdn.jsdelivr.net/npm/@fontsource/montserrat/files/montserrat-latin-400-normal.woff'
		},
		rawGithub: {
			// Intentionally using raw.githubusercontent to test if it fails (it usually does due to MIME type/CORs/HTML response)
			roboto: 'https://raw.githubusercontent.com/google/fonts/main/apache/roboto/static/Roboto-Regular.ttf'
		},
        googleFonts: {
             roboto: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf'
        }
	};
</script>

<div class="w-full h-screen bg-neutral-900 text-white">
	<div class="absolute top-4 left-4 z-10 bg-black/80 p-4 rounded max-w-sm">
		<h1 class="text-xl font-bold mb-2">Font Loading Research</h1>
		<p class="text-sm text-neutral-300 mb-2">Testing different methods to load fonts into Threlte/Troika.</p>
		<ul class="text-xs space-y-1 list-disc pl-4 text-neutral-400">
			<li><span class="text-green-400">1. Local Static File</span>: /fonts/*.woff</li>
			<li><span class="text-blue-400">2. jsDelivr CDN</span>: Using @fontsource URLs</li>
			<li><span class="text-red-400">3. GitHub Raw</span>: Direct raw.githubusercontent URLs</li>
            <li><span class="text-yellow-400">4. Google Fonts</span>: Direct fonts.gstatic.com URLs</li>
		</ul>
	</div>

	<Canvas>
		<T.PerspectiveCamera makeDefault position={[0, 0, 15]} fov={50}>
			<OrbitControls enableDamping />
		</T.PerspectiveCamera>

		<T.DirectionalLight position={[10, 10, 10]} intensity={1} />
		<T.AmbientLight intensity={0.5} />
		<T.GridHelper args={[20, 20, 0x444444, 0x222222]} rotation.x={Math.PI / 2} />

		<!-- LOCAL FONTS (Green) -->
		<T.Group position={[0, 4, 0]}>
			<Text
				text="1. Local: Roboto"
				font={fonts.local.roboto}
				fontSize={1}
				color="#4ade80"
				position={[-5, 0, 0]}
				anchorX="left"
			/>
			<Text
				text="1. Local: Montserrat"
				font={fonts.local.montserrat}
				fontSize={1}
				color="#4ade80"
				position={[2, 0, 0]}
				anchorX="left"
			/>
		</T.Group>

		<!-- CDN FONTS (Blue) -->
		<T.Group position={[0, 1, 0]}>
			<Text
				text="2. CDN: Roboto"
				font={fonts.cdn.roboto}
				fontSize={1}
				color="#60a5fa"
				position={[-5, 0, 0]}
				anchorX="left"
			/>
			<Text
				text="2. CDN: Montserrat"
				font={fonts.cdn.montserrat}
				fontSize={1}
				color="#60a5fa"
				position={[2, 0, 0]}
				anchorX="left"
			/>
		</T.Group>

		<!-- GITHUB RAW FONTS (Red - Expected Failure) -->
		<T.Group position={[0, -2, 0]}>
			<Text
				text="3. Raw: Roboto (May Fail)"
				font={fonts.rawGithub.roboto}
				fontSize={1}
				color="#f87171"
				position={[-5, 0, 0]}
				anchorX="left"
			/>
		</T.Group>

        <!-- Google Fonts (Yellow) -->
		<T.Group position={[0, -5, 0]}>
			<Text
				text="4. Google: Roboto"
				font={fonts.googleFonts.roboto}
				fontSize={1}
				color="#facc15"
				position={[-5, 0, 0]}
				anchorX="left"
			/>
		</T.Group>

	</Canvas>
</div>
