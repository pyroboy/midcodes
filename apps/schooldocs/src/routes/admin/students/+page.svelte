<script lang="ts">
  import VerifyStudentModal from '$lib/components/modals/students/VerifyStudentModal.svelte';
  import PendingStudentsTable from '$lib/components/students/PendingStudentsTable.svelte';
  import FlaggedStudentsTable from '$lib/components/students/FlaggedStudentsTable.svelte';

  let selectedStudent: any = null;
  let showModal = false;
  let activeView: 'pending' | 'flagged' = 'pending';

  function toggleView() {
    activeView = activeView === 'pending' ? 'flagged' : 'pending';
  }

  function showVerifyStudentModal(student: any) {
    selectedStudent = student;
    showModal = true;
  }

  function handleModalClose() {
    showModal = false;
    selectedStudent = null;
  }

  interface FlagEvent {
    studentId: string;
    reason: string;
    comment: string;
  }

  function handleFlag(event: CustomEvent<FlagEvent>) {
    const { studentId, reason, comment } = event.detail;
    console.log('Flagging student:', { studentId, reason, comment });
    // TODO: Implement flag logic
    showModal = false;
    selectedStudent = null;
  }

  function handleVerification(event: CustomEvent<string>) {
    const studentId = event.detail;
    console.log('Verifying student:', studentId);
    // TODO: Implement verification logic
    showModal = false;
    selectedStudent = null;
  }

  // Mock statistics data
  const stats = {
    totalVerified: 245,
    pendingVerification: 12,
    totalStudents: 257,
    verifiedThisWeek: 15,
    verificationRate: '95%',
    averageVerificationTime: '2.5 days'
  };

  // Mock pending verifications
  const pendingStudents = [
    {
      id: 'STD003',
      studentNumber: '2024-0003',
      name: 'Mike Johnson',
      course: 'Bachelor of Science in Information Technology',
      yearLevel: '2nd Year',
      uploadedAt: '2024-01-16T14:20:00Z'
    },
    {
      id: 'STD004',
      studentNumber: '2024-0004',
      name: 'Sarah Williams',
      course: 'Bachelor of Science in Nursing',
      yearLevel: '3rd Year',
      uploadedAt: '2024-01-16T15:30:00Z'
    },
    {
      id: 'STD005',
      studentNumber: '2024-0005',
      name: 'John Smith',
      course: 'Bachelor of Arts in Psychology',
      yearLevel: '1st Year',
      uploadedAt: '2024-01-16T16:15:00Z'
    },
    {
      id: 'STD006',
      studentNumber: '2024-0006',
      name: 'Emily Brown',
      course: 'Bachelor of Science in Civil Engineering',
      yearLevel: '4th Year',
      uploadedAt: '2024-01-16T16:45:00Z'
    },
    {
      id: 'STD007',
      studentNumber: '2024-0007',
      name: 'David Lee',
      course: 'Bachelor of Science in Computer Science',
      yearLevel: '2nd Year',
      uploadedAt: '2024-01-17T09:20:00Z'
    },
    {
      id: 'STD008',
      studentNumber: '2024-0008',
      name: 'Maria Garcia',
      course: 'Bachelor of Science in Architecture',
      yearLevel: '3rd Year',
      uploadedAt: '2024-01-17T10:05:00Z'
    },
    {
      id: 'STD009',
      studentNumber: '2024-0009',
      name: 'James Wilson',
      course: 'Bachelor of Arts in Communication',
      yearLevel: '2nd Year',
      uploadedAt: '2024-01-17T11:30:00Z'
    },
    {
      id: 'STD010',
      studentNumber: '2024-0010',
      name: 'Lisa Anderson',
      course: 'Bachelor of Science in Mathematics',
      yearLevel: '1st Year',
      uploadedAt: '2024-01-17T13:15:00Z'
    },
    {
      id: 'STD011',
      studentNumber: '2024-0011',
      name: 'Robert Taylor',
      course: 'Bachelor of Science in Mechanical Engineering',
      yearLevel: '4th Year',
      uploadedAt: '2024-01-17T14:45:00Z'
    },
    {
      id: 'STD012',
      studentNumber: '2024-0012',
      name: 'Patricia Martinez',
      course: 'Bachelor of Arts in Education',
      yearLevel: '3rd Year',
      uploadedAt: '2024-01-17T15:30:00Z'
    },
    {
      id: 'STD013',
      studentNumber: '2024-0013',
      name: 'Michael Thompson',
      course: 'Bachelor of Science in Chemistry',
      yearLevel: '2nd Year',
      uploadedAt: '2024-01-18T09:00:00Z'
    },
    {
      id: 'STD014',
      studentNumber: '2024-0014',
      name: 'Jennifer White',
      course: 'Bachelor of Arts in History',
      yearLevel: '1st Year',
      uploadedAt: '2024-01-18T10:20:00Z'
    },
    {
      id: 'STD015',
      studentNumber: '2024-0015',
      name: 'Christopher Davis',
      course: 'Bachelor of Science in Physics',
      yearLevel: '4th Year',
      uploadedAt: '2024-01-18T11:45:00Z'
    },
    {
      id: 'STD016',
      studentNumber: '2024-0016',
      name: 'Jessica Rodriguez',
      course: 'Bachelor of Arts in English',
      yearLevel: '3rd Year',
      uploadedAt: '2024-01-18T13:30:00Z'
    },
    {
      id: 'STD017',
      studentNumber: '2024-0017',
      name: 'Daniel Martin',
      course: 'Bachelor of Science in Biology',
      yearLevel: '2nd Year',
      uploadedAt: '2024-01-18T14:15:00Z'
    },
    {
      id: 'STD018',
      studentNumber: '2024-0018',
      name: 'Michelle Lopez',
      course: 'Bachelor of Arts in Sociology',
      yearLevel: '1st Year',
      uploadedAt: '2024-01-18T15:00:00Z'
    },
    {
      id: 'STD019',
      studentNumber: '2024-0019',
      name: 'Kevin Harris',
      course: 'Bachelor of Science in Environmental Science',
      yearLevel: '4th Year',
      uploadedAt: '2024-01-18T16:20:00Z'
    },
    {
      id: 'STD020',
      studentNumber: '2024-0020',
      name: 'Amanda Clark',
      course: 'Bachelor of Arts in Political Science',
      yearLevel: '3rd Year',
      uploadedAt: '2024-01-18T17:00:00Z'
    }
  ];

  // Mock flagged students data
  const flaggedStudents = [
    {
      id: 'STD001',
      studentNumber: '2024-0001',
      name: 'Jane Smith',
      course: 'Bachelor of Science in Computer Science',
      yearLevel: '3rd Year',
      uploadedAt: '2024-01-15T10:00:00Z',
      flagReason: 'Invalid student information',
      flaggedAt: '2024-01-15T11:30:00Z',
      flaggedBy: 'Admin User'
    },
    {
      id: 'STD002',
      studentNumber: '2024-0002',
      name: 'Tom Wilson',
      course: 'Bachelor of Arts in Economics',
      yearLevel: '2nd Year',
      uploadedAt: '2024-01-15T09:00:00Z',
      flagReason: 'Suspicious entry - needs verification',
      flaggedAt: '2024-01-15T14:20:00Z',
      flaggedBy: 'Staff User'
    }
  ];
</script>

<div class="space-y-6">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <h1 class="text-xl font-semibold text-gray-900">Student Verification Overview</h1>
      <p class="mt-2 text-sm text-gray-700">Current status of student verifications in the system.</p>
    </div>
    <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
      <a
        href="/admin/students/upload"
        class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
      >
        Upload Students
      </a>
    </div>
  </div>

  <!-- Statistics Cards -->
  <div class="flex space-x-4">
    <div class="flex-1 bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
        <div class="text-center">
          <p class="text-3xl font-bold text-gray-900">{stats.pendingVerification}</p>
          <p class="mt-2 text-sm font-medium text-gray-500">Pending Verification</p>
          <p class="mt-1 text-xs font-medium text-yellow-600">{stats.averageVerificationTime}</p>
        </div>
      </div>
    <div class="flex-1 bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
      <div class="text-center">
        <p class="text-3xl font-bold text-gray-900">{stats.totalVerified}</p>
        <p class="mt-2 text-sm font-medium text-gray-500">Verified Students</p>
        <p class="mt-1 text-xs font-medium text-green-600">{stats.verificationRate}</p>
      </div>
    </div>



    <div class="flex-1 bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
      <div class="text-center">
        <p class="text-3xl font-bold text-gray-900">{stats.verifiedThisWeek}</p>
        <p class="mt-2 text-sm font-medium text-gray-500">Verified This Week</p>
      </div>
    </div>
  </div>

  <div class="mt-8">
    <div class="flex justify-between items-center">
      <h2 class="text-lg font-medium text-gray-900">
        {activeView === 'pending' ? 'Pending' : 'Flagged'} Students
      </h2>
      <button
        on:click={toggleView}
        class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        View {activeView === 'pending' ? 'Flagged' : 'Pending'} Students
      </button>
    </div>
  
    {#if activeView === 'pending'}
      <PendingStudentsTable 
        students={pendingStudents}
        onVerifyClick={showVerifyStudentModal}
      />
    {:else}
      <FlaggedStudentsTable 
        students={flaggedStudents}
        onVerifyClick={showVerifyStudentModal}
      />
    {/if}
  </div>
</div>

<!-- Add the modal component at the bottom of your template -->
{#if selectedStudent}
  <VerifyStudentModal
    student={selectedStudent}
    show={showModal}
    on:close={handleModalClose}
    on:verify={handleVerification}
    on:flag={handleFlag}
  />
{/if}
