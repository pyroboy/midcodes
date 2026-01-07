<svelte:head>
	<title>17 Complaint Handling - DA Tirol Dorm</title>
</svelte:head>

<article class="chapter">
	<header class="chapter-header">
		<span class="chapter-number">17</span>
		<h1>Complaint Handling</h1>
	</header>

	<section class="section">
		<h2>General Guidelines</h2>
		<div class="guideline-box">
			<p class="placeholder">All complaints must be treated seriously and confidentially. The goal is to resolve issues quickly to maintain a peaceful environment.</p>
			<ul>
				<li><strong>Listen actively:</strong> Let the tenant explain without interruption.</li>
				<li><strong>Document immediately:</strong> Use the Incident/Complaint Log.</li>
				<li><strong>Remain neutral:</strong> Do not take sides, especially in roommate conflicts.</li>
				<li><strong>Follow up:</strong> Check back with the tenant after resolution.</li>
			</ul>
		</div>
	</section>

	<section class="section">
		<h2>Common Scenarios & Scripts</h2>
		
		<div class="scenario-card">
			<h3>🔊 Noise Complaint</h3>
			<p class="context"><strong>Situation:</strong> Tenant reports neighbor playing loud music during quiet hours.</p>
			<div class="script-box">
				<p class="label">Response Script (Bisaya/English):</p>
				<p class="script">"Salamat sa pag-report. Akoang adtuon karon dayon ang kwarto ug pahinumdoman sila sa atong Quiet Hours policy. I-update tika human nako sila ma-istorya."</p>
				<p class="translation">(Thank you for reporting. I will go to the room right now and remind them of our Quiet Hours policy. I'll update you after I talk to them.)</p>
			</div>
			<div class="action-steps">
				<h4>Action Steps:</h4>
				<ol>
					<li>Visit the noisy room immediately.</li>
					<li>Politely ask them to lower volume/stop noise.</li>
					<li>Warn about penalties for repeat offenses.</li>
				</ol>
			</div>
		</div>

		<div class="scenario-card">
			<h3>🕶️ Theft / Missing Items</h3>
			<p class="context"><strong>Situation:</strong> Tenant claims food/clothes missing from common area.</p>
			<div class="script-box">
				<p class="label">Response Script:</p>
				<p class="script">"Pasensya kaayo sa nahitabo. Palihug isuwat ang tanang detalye sa atong Incident Form para ma-record nato. Atong tan-awon ang CCTV kung naa ba'y makita sa area."</p>
				<p class="translation">(I'm sorry this happened. Please write all details in our Incident Form so we can record it. We will check the CCTV if there is coverage in that area.)</p>
			</div>
			<div class="action-steps">
				<h4>Action Steps:</h4>
				<ol>
					<li>Issue Incident Report Form.</li>
					<li>Review CCTV footage (if available).</li>
					<li>Remind all tenants to label items and lock valuables.</li>
				</ol>
			</div>
		</div>

		<div class="scenario-card">
			<h3>🚿 Maintenance Delay</h3>
			<p class="context"><strong>Situation:</strong> Tenant follows up on a repair reported 3 days ago.</p>
			<div class="script-box">
				<p class="label">Response Script:</p>
				<p class="script">"Pasensya na sa delay. Na-contact na namo ang plumber pero dili siya available gahapon. Gi-schedule na tika para ugma sa buntag. Okay ra ba na nga oras?"</p>
				<p class="translation">(Sorry for the delay. We contacted the plumber but he wasn't available yesterday. I scheduled you for tomorrow morning. Is that time okay?)</p>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Disciplinary Actions</h2>
		<table class="action-table">
			<thead>
				<tr>
					<th>Offense Level</th>
					<th>Example violations</th>
					<th>Action / Penalty</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><strong>Minor</strong></td>
					<td>Noise violation, leaving trash, minor mess</td>
					<td>Verbal Warning (1st), Written Warning (2nd)</td>
				</tr>
				<tr>
					<td><strong>Major</strong></td>
					<td>Smoking indoors, gate curfew violation, unauthorized guest</td>
					<td>Fine of ₱<span class="placeholder">[X]</span> + Final Warning</td>
				</tr>
				<tr>
					<td><strong>Severe</strong></td>
					<td>Theft, violence, drugs, harassment</td>
					<td><strong>Immediate Eviction</strong> + Police Report</td>
				</tr>
			</tbody>
		</table>
	</section>
</article>

<style>
	.chapter { max-width: 800px; }
	.chapter-header { margin-bottom: 3rem; }
	.chapter-number { font-family: var(--font-header); font-size: 4rem; font-weight: 700; color: var(--color-primary); opacity: 0.3; line-height: 1; }
	.chapter-header h1 { font-size: 3rem; margin-top: 0.5rem; line-height: 1.1; }
	.section { margin-bottom: 3rem; }
	.section h2 { font-size: 1.5rem; margin-bottom: 2rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-gray-200); }

	.guideline-box { background: var(--color-gray-100); padding: 1.5rem; border-left: 4px solid var(--color-primary); }
	.guideline-box ul { margin: 1rem 0 0; padding-left: 1.5rem; }
	.guideline-box li { margin-bottom: 0.5rem; }

	.scenario-card { background: white; border: 2px solid var(--color-black); padding: 1.5rem; margin-bottom: 2rem; }
	.scenario-card h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
	.context { color: #52525b; font-style: italic; margin-bottom: 1rem; }
	
	.script-box { background: #e0f2fe; padding: 1rem; border-radius: 4px; border: 1px solid #7dd3fc; margin-bottom: 1rem; }
	.script-box .label { font-size: 0.8rem; text-transform: uppercase; font-weight: 700; color: #0284c7; margin-bottom: 0.25rem; }
	.script-box .script { font-size: 1.1rem; font-weight: 600; color: #0c4a6e; margin-bottom: 0.5rem; font-family: "Georgia", serif; }
	.script-box .translation { font-size: 0.9rem; color: #0369a1; font-style: italic; }

	.action-steps h4 { font-size: 0.95rem; text-transform: uppercase; margin-bottom: 0.5rem; }
	.action-steps ol { margin: 0; padding-left: 1.5rem; }

	.action-table { width: 100%; border-collapse: collapse; }
	.action-table th, .action-table td { padding: 1rem; border: 1px solid var(--color-gray-200); text-align: left; vertical-align: top; }
	.action-table th { background: var(--color-black); color: white; }
	.action-table tr:nth-child(even) { background: var(--color-gray-100); }

	.placeholder { background: #fef3c7; padding: 0 0.25rem; }
</style>
