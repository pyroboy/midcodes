<script lang="ts">
    import ArticlePage from '$lib/components/ArticlePage.svelte';

    // --- ARTICLE DATA ---
    const article = {
        title: 'Rising in Newness of Life: Water Baptism at MOFI-Manlawaan',
        date: 'November 29, 2025',
        category: 'Baptism',
        description: 'Brothers and sisters from MOFI-Manlawaan, Sta. Catalina, Negros Oriental publicly declared their faith through water baptism.',
        images: [
            {
                url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1764921556/ruzidig9ogfk8gjouqwj.jpg',
                alt: 'Water Baptism at MOFI-Manlawaan',
                caption: ''
            },
            {
                url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1764921556/nk5nhdbyl8nxw9brdoqc.jpg',
                alt: 'Baptism Celebration',
                caption: ''
            },
            {
                url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1764921556/lwsce2nfjnmmoqou0pro.jpg',
                alt: 'New Believers Baptized',
                caption: ''
            },
            {
                url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1764921556/jkmpck6ybmywibodg2hb.jpg',
                alt: 'MOFI-Manlawaan Baptism Service',
                caption: ''
            }
        ],
        content: [
            { type: 'imageCarousel' as const },
            { type: 'heading' as const, text: 'Rejoice and Praise the Lord Jesus Christ!' },
            { type: 'paragraph' as const, text: 'Today, our brothers and sisters from <strong>MOFI–Manlawaan, Sta. Catalina, Negros Oriental</strong> publicly declared their faith through water baptism. A beautiful symbol of leaving the old life behind and rising anew in Christ.' },
            { type: 'heading' as const, text: 'To All Who Were Baptized Today' },
            { type: 'paragraph' as const, text: 'May you continue to grow in faith, stand firm in God\'s promises, and walk boldly in the new life He has given you. This is just the beginning of a greater journey with the Lord.' },
            { type: 'quote' as const, text: 'Keep seeking Him, keep serving Him, and keep shining His light wherever you go.' },
            { type: 'paragraph' as const, text: '<strong>Welcome to the family of believers!</strong>' },
            { type: 'paragraph' as const, text: 'To God be all the glory!' },
            { type: 'social' as const, platform: 'facebook', url: 'https://www.facebook.com/profile.php?id=61561735934699', label: 'Follow MOFI-Manlawaan on Facebook' }
        ]
    };
</script>

<ArticlePage {article} />
