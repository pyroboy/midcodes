<script lang="ts">
import { onMount } from 'svelte';
import { fly } from 'svelte/transition';

const profile = {
  name: "MUTYA KISMET TIROL MACUNO, MD, FPPS, FPSNbM, MDM",
  prcLicense: "56897",
  email: "mmacuno@rocketmail.com",
  contact: "+63917 812 1668",
  education: [
    { level: "Elementary", school: "University of Bohol", year: "1970" },
    { level: "Secondary", school: "University of Bohol", year: "1974" },
    { level: "College", school: "Velez College (Bachelor of Science in English)", year: "1978" },
    { level: "Graduate Studies", school: "Cebu Institute of Medicine (Doctor of Medicine)", year: "1983" },
    { level: "Masters", school: "Development Academy of the Philippines (Masters in Development Management)", year: "" }
  ],
  experience: [
    { position: "Medical Center Chief II", company: "Governor Celestino Gallares Memorial Medical Center", period: "October 24, 2016 up to present" },
    { position: "Chief of Hospital II", company: "Don Emilio del Valle Memorial Hospital", period: "July 1, 2014 – October 23, 2017" },
    { position: "Chief of Hospital I", company: "Don Emilio del Valle Memorial Hospital", period: "September 7, 2011 – June 30, 2014" },
    { position: "Medical Specialist II", company: "Governor Celestino Gallares Memorial Hospital", period: "March 12, 2001 – November 14, 2009" },
    { position: "Medical Specialist I", company: "Governor Celestino Gallares Memorial Hospital", period: "March 13, 1999 – March 11, 2001" },
    { position: "Medical Officer IV", company: "Governor Celestino Gallares Memorial Hospital", period: "December 15, 1990 – March 2, 1999" },
    { position: "Medical Officer III", company: "Governor Celestino Gallares Memorial Hospital", period: "February 6, 1985 – February 5, 1989" },
    { position: "Head, Neonatology Section / Training Officer Pediatrics Department", company: "Governor Celestino Gallares Memorial Hospital", period: "April 15, 1998 – November 14, 2009" },
    { position: "OIC – Chief Medical Professional Staff", company: "Governor Celestino Gallares Memorial Hospital", period: "January 1, 2007 – August 31, 2007" },
    { position: "Assistant Chairperson, Pediatrics Department", company: "Governor Celestino Gallares Memorial Hospital", period: "April 15, 1998 – December 31, 2006" },
    { position: "Member, Board of Directors", company: "Ramiro Community Hospital", period: "March 2, 2000 – March 31, 2003" },
    { position: "School Physician", company: "University of Bohol", period: "August 15, 2000 – August 31, 2008" }
  ],
  training: [
    { name: "2ND ASEAN Health Care Transformation Summit", date: "September 6 – 8, 2022" },
    { name: "Strategic Writeshop on HFEP-MO", date: "July 28 – 30, 2022" },
    { name: "2019 National Conference on Exhibition", date: "October 25 – 29, 2019" },
    { name: "11th Performance Governance System Module 1 for Hospitals", date: "August 27 – 29, 2019" },
    { name: "Transformational Leadership", date: "February 17 – 20, 2014" },
    { name: "Managing High Performing Public Sector Organization", date: "November 11-12, 2013" },
    { name: "Risk Communication Training", date: "September 18 – 20, 2013" },
    { name: "ISO 9001:2008 Internal Quality Audit", date: "September 4 – 6, 2013" },
    { name: "National Workshop on Social Dialogue – Management Tool in Public Sector", date: "August 29 – 31, 2013" },
    { name: "Interlocal Health Zone Situational Workshop", date: "May 5, 2013" },
    { name: "Knowledge Management Orientation", date: "April 2, 2013" },
    { name: "New Leadership style for 21st Century", date: "November 5-7, 2012" },
    { name: "Philippine Governance Cascading Workshop for Department of Health Hospitals", date: "October 7, 2012" },
    { name: "Department of Health – Procurement Convention", date: "September 10, 2012" },
    { name: "Seminar on Pediatrics Disaster Management Program", date: "December 14-15, 2011" }
  ],
  voluntary: [
    { position: "Board of Director", organization: "Philippine National Red Cross", period: "08/15/2012 to Present" },
    { position: "Board of Director", organization: "Philippine Hospital Association", period: "2020 – Present" },
    { position: "Vice-President for Visayas", organization: "Philippine Hospital Association", period: "2018 – 2019" },
    { position: "Board of Director", organization: "Philippine Hospital Association", period: "2016 – 2017" },
    { position: "Board of Director", organization: "Bohol Northern Star, Inc.", period: "" }
  ],
  interests: ["Reading", "biking", "photography"],
  awards: ["Triathlon, First Place Relay"]
};



let mounted = $state(false);
let showImages = $state(false);
let isMobile = $state(false);

onMount(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
  mounted = true;
  return () => window.removeEventListener('resize', checkMobile);
});

function checkMobile() {
  isMobile = window.innerWidth < 768;
}

function toggleView() {
  showImages = !showImages;
  if(!showImages) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
</script>

<div class="container mx-auto px-4 py-24 min-h-screen relative">
  <div class="grid grid-cols-1 gap-8 mb-24">
    <!-- Images Column -->


    <!-- CV Content -->
      <div id="cv-section" 
           class="bg-white/80 backdrop-blur rounded-xl p-8 shadow-xl"
           transition:fly={{ y: 50, duration: 500 }}>
        <div class="space-y-12">
          <header class="space-y-4">
            <h1 class="text-3xl font-bold">{profile.name}</h1>
            <div class="space-y-2 text-gray-600">
              <p>PRC License Number: {profile.prcLicense}</p>
              <p>Email: {profile.email}</p>
              <p>Contact: {profile.contact}</p>
            </div>
          </header>

          <section>
            <h2 class="text-2xl font-semibold mb-4">Educational Background</h2>
            <div class="space-y-4">
              {#each profile.education as edu}
                <div>
                  <h3 class="font-medium">{edu.level}</h3>
                  <p class="text-gray-600">{edu.school} {edu.year ? `– ${edu.year}` : ''}</p>
                </div>
              {/each}
            </div>
          </section>

          <section>
            <h2 class="text-2xl font-semibold mb-4">Work Experience</h2>
            <div class="space-y-4">
              {#each profile.experience as exp}
                <div>
                  <h3 class="font-medium">{exp.position}</h3>
                  <p>{exp.company}</p>
                  <p class="text-gray-600">{exp.period}</p>
                </div>
              {/each}
            </div>
          </section>

          <section>
            <h2 class="text-2xl font-semibold mb-4">Training Programs Attended</h2>
            <div class="space-y-4">
              {#each profile.training as training}
                <div>
                  <h3 class="font-medium">{training.name}</h3>
                  <p class="text-gray-600">{training.date}</p>
                </div>
              {/each}
            </div>
          </section>

          <section>
            <h2 class="text-2xl font-semibold mb-4">Voluntary Work / Involvement in Civic Organizations</h2>
            <div class="space-y-4">
              {#each profile.voluntary as vol}
                <div>
                  <h3 class="font-medium">{vol.position}</h3>
                  <p>{vol.organization}</p>
                  {#if vol.period}
                    <p class="text-gray-600">{vol.period}</p>
                  {/if}
                </div>
              {/each}
            </div>
          </section>

          <section class="grid md:grid-cols-2 gap-8">
            <div>
              <h2 class="text-2xl font-semibold mb-4">Interests</h2>
              <ul class="list-disc list-inside space-y-1">
                {#each profile.interests as interest}
                  <li>{interest}</li>
                {/each}
              </ul>
            </div>

            <div>
              <h2 class="text-2xl font-semibold mb-4">Awards</h2>
              <ul class="list-disc list-inside space-y-1">
                {#each profile.awards as award}
                  <li>{award}</li>
                {/each}
              </ul>
            </div>
          </section>

          <footer class="pt-8 border-t">
            <p class="text-sm text-gray-600">
              I hereby certify that all the information mentioned above are true.
            </p>
            <p class="mt-4 font-medium">
              {profile.name}<br>
              Medical Center Chief II<br>
              Governor Celestino Gallares Memorial Medical Center
            </p>
          </footer>
        </div>
      </div>
  </div>


</div>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }
</style>