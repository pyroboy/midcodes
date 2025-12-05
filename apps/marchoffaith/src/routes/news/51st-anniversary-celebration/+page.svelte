<script lang="ts">
    import ArticlePage from '$lib/components/ArticlePage.svelte';

    // --- ARTICLE DATA ---
    const article = {
        title: 'March of Faith Inc. Marks 51 Years of Unyielding Gospel Advance',
        date: 'November 16, 2025',
        category: 'Events',
        description: 'March of Faith Inc. celebrates its 51st Foundation Day across 13 locations in Bohol and Negros Oriental.',
        images: [
            {
                url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359983/tp0rs7obrolyxzzx88ww.jpg',
                alt: '51st Anniversary Celebration',
                caption: 'March of Faith 51st Anniversary Celebration Service'
            },
            {
                url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359983/yfitomjie5maevvj2mp5.jpg',
                alt: 'Worship team leading the congregation',
                caption: 'Worship team leading the congregation in praise and worship'
            },
            {
                url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359983/i8u8getdupgaxdgyqqpl.jpg',
                alt: 'Pastor delivering the message',
                caption: 'Pastor delivering the anniversary message to the congregation'
            },
            {
                url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359984/sfewc9c6qvtprbvt0m7y.jpg',
                alt: 'Congregational worship',
                caption: 'Members of the congregation participating in worship'
            },
            {
                url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359983/ks4dfsafoxgrp8wdk3jr.jpg',
                alt: 'Youth group performance',
                caption: 'Youth group special performance during the celebration'
            },
            {
                url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359983/o9gbuact3klwl6ia4ppd.jpg',
                alt: 'Church leaders in prayer',
                caption: 'Church leaders joining in prayer during the service'
            },
            {
                url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1763359983/wa2cepmyildowei3erwu.jpg',
                alt: 'Closing worship',
                caption: 'Closing worship and benediction of the 51st Anniversary Celebration'
            }
        ],
        content: [
            { type: 'imageCarousel' as const },
            { type: 'paragraph' as const, text: '<strong>TAGBILARAN CITY</strong> — Across thirteen distinct locations spanning the islands of Bohol and Negros Oriental, March of Faith Inc. celebrated its 51st Foundation Day on November 16, 2025. The event was not merely a commemoration of time passed, but a synchronized declaration of the ministry\'s enduring mission.' },
            { type: 'paragraph' as const, text: 'Half a century ago, the late <strong>Dr. Rev. Rudy Trigo</strong> established the ministry\'s foundations, heeding a divine call to ignite a movement in the Visayas. Today, that torch is borne by his son and successor, <strong>Ralph Steven Dinsay Trigo</strong>, who leads the organization with a vision that honors its heritage while aggressively pursuing its future.' },
            { type: 'heading' as const, text: 'A Rallying Cry: Endure and Proclaim' },
            { type: 'paragraph' as const, text: 'The celebration centered on the theme "Endure and Proclaim," derived from Matthew 24:13-14. This was more than a slogan; it served as a strategic mandate for every believer within the network—a reminder that the work of evangelism requires resilience.' },
            { type: 'quote' as const, text: 'Our mission is not complete until every soul has heard the Good News. This anniversary is a call to perseverance. We do not just look back at what has been done; we look forward with renewed grit, anchoring our hearts in Christ as we advance the Kingdom to the very end.' },
            { type: 'paragraph' as const, text: 'Despite geographic separation, the spirit of the celebration was singular. From the bustling streets of Tagbilaran to the quiet barangays of Negros, congregations united in simultaneous worship, breaking bread, performing baptisms, and engaging in community outreach.' },
            { type: 'heading' as const, text: 'Unified Across 13 Locations' },
            { type: 'paragraph' as const, text: 'The simultaneous services were held in the following communities:' },
            { type: 'list' as const, items: [
                'Tagbilaran City, Bohol',
                'Triple Union, Catigbian, Bohol',
                'Caningag, Alicia, Bohol',
                'Libertad, Tubigon, Bohol',
                'Ajong, Sibulan, Negros Oriental',
                'Poblacion, Sibulan, Negros Oriental',
                'Magatas, Sibulan, Negros Oriental',
                'Pinucawan, Tayasan, Negros Oriental',
                'Cambaye, Tayasan, Negros Oriental',
                'Linao, Tayasan, Negros Oriental',
                'Dumaguete City, Negros Oriental',
                'Bolisong, Manjuyod, Negros Oriental',
                'Manlawaan, Sta. Catalina, Negros Oriental'
            ] },
            { type: 'paragraph' as const, text: 'As March of Faith Inc. steps into its 52nd year, the organization remains steadfast. With plans already in motion for new church plants and expanded community development initiatives, the 51st anniversary stands as a testament to God\'s faithfulness and a launchpad for the work yet to be done.' }
        ]
    };
</script>

<ArticlePage {article} />
