<script lang="ts">
	// Get current year automatically
	const currentYear: number = new Date().getFullYear();
</script>

<footer class="site-footer">
    <!-- Top Decorative Brand Line -->
    <div class="footer-border"></div>

    <div class="container">
        <div class="footer-grid">
            <!-- 1. Brand Column -->
            <div class="footer-col brand-col">
                <div class="footer-logo">
                    <img 
                        src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1763355713/ojlomimmfvtgwzxjyptq.webp" 
                        alt="March of Faith Logo" 
                        class="logo-img"
                    />
                    <div class="brand-text">
                        <h3>March of Faith Inc.</h3>
                        <span class="tagline">Every Creature is Reachable</span>
                    </div>
                </div>
                <p class="about-text">
                    Strengthening faith and building community in Bohol and throughout the Philippines. A legacy of spiritual fatherhood since 1974.
                </p>
                <div class="social-links">
                    <a href="https://facebook.com" target="_blank" aria-label="Facebook" class="social-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                    </a>
                    <a href="https://youtube.com" target="_blank" aria-label="YouTube" class="social-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg>
                    </a>
                    <a href="mailto:marchoffaithincorporated@gmail.com" aria-label="Email" class="social-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                    </a>
                </div>
            </div>

            <!-- 2. Quick Links Column -->
            <div class="footer-col links-col">
                <h4>Quick Links</h4>
                <ul class="footer-links">
                    <li><a href="/about">About Us</a></li>
                    <li><a href="/churches">Our Churches</a></li>
                    <li><a href="/pastors">Leadership</a></li>
                    <li><a href="/docs">Resources</a></li>
                    <li><a href="/news">News & Updates</a></li>
                </ul>
            </div>

            <!-- 3. Service Schedule Column -->
            <div class="footer-col schedule-col">
                <h4>Service Schedule</h4>
                <ul class="schedule-list">
                    <li>
                        <span class="day">Sunday Morning</span>
                        <span class="time">9:00 AM</span>
                    </li>
                    <li>
                        <span class="day">Sunday Evening</span>
                        <span class="time">4:00 PM</span>
                    </li>
                    <li>
                        <span class="day">Wed. Bible Study</span>
                        <span class="time">7:00 PM</span>
                    </li>
                    <li>
                        <span class="day">Daily Prayer</span>
                        <span class="time">6:00 AM</span>
                    </li>
                </ul>
            </div>

            <!-- 4. Contact Column -->
            <div class="footer-col contact-col">
                <h4>Contact Us</h4>
                <div class="contact-info">
                    <div class="contact-item">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                        <span>San Isidro District<br>Tagbilaran City, Bohol</span>
                    </div>
                    <div class="contact-item">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
                        <a href="tel:+639999536700">+63 99 9953 6700</a>
                    </div>
                </div>
                <a href="/contact" class="footer-btn">Plan Your Visit</a>
            </div>
        </div>
    </div>

    <!-- Bottom Bar -->
    <div class="footer-bottom">
        <div class="container bottom-container">
            <div class="copyright">
                &copy; {currentYear} March of Faith Incorporated.
            </div>
            <div class="legal">
                <span>SEC Reg. No. 0000058834</span>
                <span class="separator">•</span>
                <a href="/docs">Privacy Policy</a>
            </div>
        </div>
    </div>
</footer>

<style>
    /* --- Variables --- */
    :root {
        /* Original Base Color (#2c3e50) modified with a darker gradient end */
        --footer-bg-start: #2c3e50;
        --footer-bg-end: #1a252f; 
        --footer-text: #d1d5db;
        --footer-heading: #ffffff;
        --accent-red: #C1272D; /* Brand Red for highlights */
    }

    /* --- Layout & Background --- */
    .site-footer {
        /* Professional Gradient based on the original color */
        background: linear-gradient(150deg, var(--footer-bg-start) 0%, var(--footer-bg-end) 100%);
        color: var(--footer-text);
        font-family: 'Montserrat', sans-serif;
        position: relative;
        padding-top: 5rem;
        font-size: 0.95rem;
    }

    /* Top Border Line (Brand Red) */
    .footer-border {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: linear-gradient(90deg, #981B1E, #C1272D, #981B1E);
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
    }

    .footer-grid {
        display: grid;
        grid-template-columns: 1.5fr 1fr 1fr 1.2fr;
        gap: 3rem;
        padding-bottom: 4rem;
    }

    /* --- Typography --- */
    h4 {
        font-family: 'Roboto Slab', serif;
        color: var(--footer-heading);
        font-size: 1.15rem;
        margin-bottom: 1.5rem;
        font-weight: 700;
        letter-spacing: 0.5px;
        position: relative;
        display: inline-block;
    }

    /* Subtle underline for headings */
    h4::after {
        content: '';
        position: absolute;
        left: 0;
        bottom: -8px;
        width: 30px;
        height: 2px;
        background-color: var(--accent-red);
        border-radius: 2px;
    }

    /* --- Column 1: Brand --- */
    .footer-logo {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .logo-img {
        width: 60px;
        height: 60px;
        object-fit: contain;
    }

    .brand-text h3 {
        font-family: 'Roboto Slab', serif;
        font-size: 1.25rem;
        color: white;
        margin: 0;
        line-height: 1;
        font-weight: 700;
    }

    .tagline {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #a8b2c1; /* Light blue-grey to match background tone */
        font-weight: 600;
        margin-top: 4px;
        display: block;
    }

    .about-text {
        line-height: 1.6;
        margin-bottom: 1.5rem;
        opacity: 0.9;
        max-width: 320px;
    }

    .social-links {
        display: flex;
        gap: 0.75rem;
    }

    .social-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        background: rgba(255,255,255,0.1);
        color: white;
        border-radius: 50%;
        transition: all 0.3s ease;
        border: 1px solid rgba(255,255,255,0.1);
    }

    .social-icon:hover {
        background: var(--accent-red);
        border-color: var(--accent-red);
        transform: translateY(-3px);
    }

    /* --- Column 2: Links --- */
    .footer-links {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .footer-links li {
        margin-bottom: 0.8rem;
    }

    .footer-links a {
        color: var(--footer-text);
        text-decoration: none;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
    }

    .footer-links a:hover {
        color: white;
        transform: translateX(5px);
        color: var(--accent-red);
    }

    /* --- Column 3: Schedule --- */
    .schedule-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .schedule-list li {
        display: flex;
        flex-direction: column;
        margin-bottom: 1rem;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        padding-bottom: 0.5rem;
    }

    .schedule-list li:last-child {
        border: none;
        margin-bottom: 0;
        padding-bottom: 0;
    }

    .schedule-list .day {
        color: white;
        font-weight: 600;
        font-size: 0.9rem;
    }

    .schedule-list .time {
        color: #a8b2c1;
        font-size: 0.85rem;
        margin-top: 2px;
    }

    /* --- Column 4: Contact --- */
    .contact-info {
        margin-bottom: 1.5rem;
    }

    .contact-item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1rem;
        line-height: 1.4;
    }

    .contact-item .icon {
        width: 20px;
        height: 20px;
        color: var(--accent-red);
        flex-shrink: 0;
        margin-top: 2px;
    }

    .contact-item a {
        color: var(--footer-text);
        text-decoration: none;
        transition: color 0.2s;
    }

    .contact-item a:hover {
        color: white;
    }

    .footer-btn {
        display: inline-block;
        padding: 0.8rem 1.5rem;
        background: var(--accent-red);
        color: white;
        text-decoration: none;
        font-size: 0.85rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-radius: 4px;
        transition: all 0.3s ease;
        text-align: center;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }

    .footer-btn:hover {
        background: #981B1E;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }

    /* --- Bottom Bar --- */
    .footer-bottom {
        background-color: rgba(0,0,0,0.2); /* Darker overlay */
        padding: 1.5rem 0;
        border-top: 1px solid rgba(255,255,255,0.05);
        font-size: 0.85rem;
        color: #889099;
    }

    .bottom-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .legal a {
        color: #889099;
        text-decoration: none;
        transition: color 0.2s;
    }

    .legal a:hover {
        color: white;
        text-decoration: underline;
    }

    .separator {
        margin: 0 0.5rem;
        opacity: 0.5;
    }

    /* --- Responsive --- */
    @media (max-width: 1024px) {
        .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 2.5rem;
        }
    }

    @media (max-width: 768px) {
        .site-footer {
            padding-top: 4rem;
        }

        .footer-grid {
            grid-template-columns: 1fr;
            gap: 3rem;
            text-align: left; /* Or center if preferred */
        }

        .bottom-container {
            flex-direction: column;
            text-align: center;
        }

        .footer-logo {
            /* Align logo with text */
            justify-content: flex-start;
        }
        
        .footer-btn {
            display: block;
            width: 100%;
        }
    }
</style>