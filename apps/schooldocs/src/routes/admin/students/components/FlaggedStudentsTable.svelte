<script lang="ts">
  export let students: Array<{
    id: string;
    studentNumber: string;
    name: string;
    course: string;
    yearLevel: string;
    uploadedAt: string;
    flagReason: string;
    flaggedAt: string;
    flaggedBy: string;
  }>;

  export let onVerifyClick: (student: any) => void;
</script>

<div class="mt-4 flex flex-col">
  <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
    <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
      <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table class="min-w-full divide-y divide-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Student Number</th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Course</th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Flag Reason</th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Flagged Date</th>
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            {#each students as student}
              <tr>
                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{student.studentNumber}</td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{student.name}</td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{student.course}</td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-red-500">{student.flagReason}</td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {new Date(student.flaggedAt).toLocaleDateString()}
                </td>
                <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button 
                    on:click={() => onVerifyClick(student)}
                    class="text-indigo-600 hover:text-indigo-900"
                  >
                    Review
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>