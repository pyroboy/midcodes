<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
</script>

<div class="container mx-auto py-8">
  <h1 class="text-4xl font-bold mb-4">SECTION: MARKETING_PLAYBOOK</h1>
  <p class="text-muted-foreground mb-8">Kanaya Growth & Media Playbook | Consolidated Strategy • Jan 2026</p>

  <div class="grid gap-8">
    <section>
      <h2 class="text-2xl font-bold mb-4">I. Core Narratives (The Scripts)</h2>
      <p class="text-muted-foreground mb-4">These are the fundamental truths we tell clients. Use these across ALL channels (FB, YT, Email).</p>
      <div class="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Narrative A: "The Anti-Fade" (Tier 1)</CardTitle>
          </CardHeader>
          <CardContent class="prose dark:prose-invert">
            <ul>
              <li><strong>Hook:</strong> "Stop buying IDs that fade in 6 months."</li>
              <li><strong>Proof:</strong> The Scratch Test. Coin vs. Thermal ID.</li>
              <li><strong>Offer:</strong> "Sandwich Technology" (Ink fused inside plastic).</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Narrative B: "The Safety Gap" (SaaS)</CardTitle>
          </CardHeader>
          <CardContent class="prose dark:prose-invert">
            <ul>
              <li><strong>Hook:</strong> "If a stranger fetched a Grade 1 student, would your guard know?"</li>
              <li><strong>Solution:</strong> Scan-to-Verify. Green = GO, Red = STOP.</li>
              <li><strong>Feature:</strong> Automated SMS to parents.</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Narrative C: "The Photoshop Killer" (B2B/Reseller)</CardTitle>
          </CardHeader>
          <CardContent class="prose dark:prose-invert">
            <ul>
              <li><strong>Hook:</strong> "Stop layouting IDs manually."</li>
              <li><strong>Agitate:</strong> "Excel > Copy > Paste > Resize > Repeat = 3 Days."</li>
              <li><strong>Solution:</strong> Kanaya Studio. 500 IDs in 5 minutes.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>

    <section>
      <h2 class="text-2xl font-bold mb-4">II. Channel Deployment</h2>
      <div class="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Facebook (The "Official Office")</CardTitle>
          </CardHeader>
          <CardContent class="prose dark:prose-invert">
            <ul>
              <li><strong>Strategy:</strong> The 3-3-1 Rule (3 Educational, 3 Proof, 1 Hard Sell).</li>
              <li><strong>Ad Tactics:</strong> "Anti-Burn" Philosophy. Spend ₱150/day for 3 days. 0 messages = Kill ad.</li>
              <li><strong>ROAS Math:</strong> Spend ₱1k -> 20 Leads -> 1 Client -> ₱15k Revenue (15x ROAS).</li>
              <li><strong>Community Mgmt:</strong> Never reply "PM Sent". Always public reply with value, then DM.</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>2. YouTube (The "Trust Engine")</CardTitle>
          </CardHeader>
          <CardContent class="prose dark:prose-invert">
            <ul>
              <li><strong>Target A (Principals):</strong> "Campus Safety Series" (Professional, Clean).</li>
              <li><strong>Target B (Print Shops):</strong> "Kanaya Studio Tutorials" (Fast, Tech-heavy).</li>
              <li><strong>Distribution:</strong> Send video links in email quotes. Put QR codes on sample IDs linking to videos.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>

    <section>
      <h2 class="text-2xl font-bold mb-4">III. Active Promos</h2>
      <Card>
        <CardContent class="prose dark:prose-invert pt-6">
          <ul>
            <li><strong>"Smart Campus" Starter:</strong> Buy Tier 1 IDs @ Standard Price, get 1-Year System Access FREE.</li>
            <li><strong>"Fading ID" Trade-In:</strong> Surrender 1 competitor ID for 10% off.</li>
            <li><strong>"Early Bird" Summer:</strong> 50% downpayment in May = Free Lanyards.</li>
          </ul>
        </CardContent>
      </Card>
    </section>

    <section>
      <h2 class="text-2xl font-bold mb-4">IV. Templates & Copy (Do Not Delete)</h2>
      <div class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Template A: Formal Meeting Request (For Principals)</CardTitle>
          </CardHeader>
          <CardContent>
            <blockquote class="border-l-4 border-primary pl-4 py-2 italic whitespace-pre-wrap">
Subject: Proposal for Campus Security & Student Identification Upgrade

Dear Sir/Ma'am:

Good day. I am writing to propose a modernization of your current Student Identification System. Traditional laminated IDs fade quickly and offer no safeguards against unauthorized individuals.

Kanaya Identity Solutions is a Bohol-based technology provider. Our Smart ID System lets your security personnel verify a student's enrollment status instantly via mobile scanning.

We are not asking for a commitment today. We only request 10 minutes to demonstrate a live prototype of the Scan-and-Verify system. I will follow up with your office on [Day of Week].

Respectfully yours,
[Your Name], Operations Head
            </blockquote>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template B: SaaS Landing Page Hero</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="bg-muted p-4 rounded-lg">
              <p class="font-bold text-lg mb-2">Headline: Stop Layouting IDs in Photoshop.</p>
              <p class="mb-4 text-muted-foreground">Sub-headline: The ID Card Automation Tool for print shops—generate 500 Print-Ready Files in 5 minutes.</p>
              <p class="mb-4"><span class="bg-primary text-primary-foreground px-4 py-2 rounded">Button: Start Free Trial (No Credit Card Required).</span></p>
              <p class="font-bold">Features: <span class="font-normal text-muted-foreground">Excel to PDF, Mirror Mode Ready, Smart Layouts.</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  </div>
</div>
