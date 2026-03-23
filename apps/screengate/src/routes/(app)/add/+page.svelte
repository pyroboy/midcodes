<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form: formResult } = $props();
	let activeTab = $state<'student' | 'employee' | 'grade'>('student');
</script>

<svelte:head>
	<title>Manage — ScreenGate</title>
</svelte:head>

<div class="p-6">
	<h1 class="text-2xl font-bold text-white mb-6">Manage People & Grades</h1>

	{#if formResult?.error}
		<div class="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">{formResult.error}</div>
	{/if}
	{#if formResult?.success}
		<div class="bg-emerald-900/50 border border-emerald-700 text-emerald-300 px-4 py-3 rounded-lg mb-4">Added successfully!</div>
	{/if}

	<!-- Tabs -->
	<div class="flex gap-2 mb-6">
		{#each ['student', 'employee', 'grade'] as tab}
			<button
				onclick={() => activeTab = tab as any}
				class="px-4 py-2 rounded-lg transition font-medium {activeTab === tab ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}"
			>
				{tab.charAt(0).toUpperCase() + tab.slice(1)}
			</button>
		{/each}
	</div>

	<div class="flex gap-6 flex-col lg:flex-row">
		<!-- Form -->
		<div class="lg:w-1/2">
			<div class="bg-gray-800 rounded-xl p-6 shadow-lg">
				{#if activeTab === 'student'}
					<h2 class="text-xl font-semibold text-white mb-4">Add Student</h2>
					<form method="POST" action="?/addStudent" use:enhance class="space-y-3">
						<input name="idNumber" placeholder="ID Number" required
							class="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none" />
						<input name="fullName" placeholder="Full Name" required
							class="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none" />
						<select name="gradeId" required
							class="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none">
							<option value="" hidden>Choose Grade</option>
							{#each data.grades as grade}
								<option value={grade.id}>{grade.name}</option>
							{/each}
						</select>

						<div class="border-t border-gray-700 pt-3 mt-3">
							<p class="text-sm text-gray-400 mb-2">Contacts (optional)</p>
							<div class="grid grid-cols-2 gap-2">
								<input name="motherName" placeholder="Mother Name" class="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 text-sm focus:border-orange-500 focus:outline-none" />
								<input name="motherPhone" placeholder="Mother Phone" class="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 text-sm focus:border-orange-500 focus:outline-none" />
								<input name="fatherName" placeholder="Father Name" class="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 text-sm focus:border-orange-500 focus:outline-none" />
								<input name="fatherPhone" placeholder="Father Phone" class="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 text-sm focus:border-orange-500 focus:outline-none" />
								<input name="guardianName" placeholder="Guardian Name" class="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 text-sm focus:border-orange-500 focus:outline-none" />
								<input name="guardianPhone" placeholder="Guardian Phone" class="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 text-sm focus:border-orange-500 focus:outline-none" />
							</div>
						</div>

						<button type="submit" class="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium mt-4">
							Add Student
						</button>
					</form>

				{:else if activeTab === 'employee'}
					<h2 class="text-xl font-semibold text-white mb-4">Add Employee</h2>
					<form method="POST" action="?/addEmployee" use:enhance class="space-y-3">
						<input name="idNumber" placeholder="ID Number" required
							class="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none" />
						<input name="fullName" placeholder="Full Name" required
							class="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none" />
						<input name="position" placeholder="Position" required
							class="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none" />
						<button type="submit" class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
							Add Employee
						</button>
					</form>

				{:else}
					<h2 class="text-xl font-semibold text-white mb-4">Add Grade</h2>
					<form method="POST" action="?/addGrade" use:enhance class="space-y-3">
						<input name="name" placeholder="Grade Name (e.g. Grade 7)" required
							class="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none" />
						<button type="submit" class="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
							Add Grade
						</button>
					</form>
				{/if}
			</div>
		</div>

		<!-- People table -->
		<div class="lg:w-1/2">
			<div class="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
				<table class="w-full">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="text-left text-gray-400 text-sm font-medium px-4 py-3">ID</th>
							<th class="text-left text-gray-400 text-sm font-medium px-4 py-3">Name</th>
							<th class="text-left text-gray-400 text-sm font-medium px-4 py-3">Type</th>
						</tr>
					</thead>
					<tbody>
						{#each data.people as person (person.id)}
							<tr class="border-b border-gray-700/50 hover:bg-gray-700/30 transition">
								<td class="px-4 py-2 text-gray-300 font-mono text-sm">{person.idNumber}</td>
								<td class="px-4 py-2 text-white">{person.fullName}</td>
								<td class="px-4 py-2">
									<span class="text-xs px-2 py-1 rounded-full {person.type === 'student' ? 'bg-emerald-900 text-emerald-300' : 'bg-blue-900 text-blue-300'}">
										{person.type}
									</span>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="3" class="px-4 py-8 text-center text-gray-500">No people added yet</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
