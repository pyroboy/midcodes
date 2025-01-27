
<div class="footer-container">
    <footer class="relative w-full h-12">
        <div class="wave-container">
            <div class="wave wave-one" />
            <div class="wave wave-two" />
            <div class="wave wave-three" />
        </div>

    </footer>
</div>

<style>
    .footer-container {
        position: relative;
        width: 100%;
        height: 3em;
        overflow: hidden;
        background: transparent;
        pointer-events: none;
        z-index: 10;
        border-radius: 0 0 2px 2px;
    }

    .wave-container {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: 0 0 1rem 1rem;
    }

    .wave {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 1000%;
        background-repeat: repeat-x;
        background-size: 2000px 100%;
        animation: waveAnimation 40s linear infinite;
        pointer-events: none;
        border-radius: 0 0 1rem 1rem;
    }

    .wave-one {
        height: 150px;
        background: linear-gradient(45deg, rgb(234, 179, 8), rgb(255, 38, 0));
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 98'%3E%3Cpath d='M 800 83.309 C 644.5 83.309 595.1 74.832 394.5 74.849 C 194.5 74.849 144.5 83.309 0 83.309 L 0 88.7 L 800 88.7 L 800 88.666 L 800 83.309 Z' fill='%23003F7C'/%3E%3C/svg%3E");
        mask-size: 1600px 120%;
        mask-repeat: repeat-x;
        animation-duration: 40s;
        z-index: 3;
    }

    .wave-two {
        height: 180px;
        background: linear-gradient(45deg, rgb(220, 38, 38), rgb(140, 17, 255));
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 98'%3E%3Cpath d='M 800 83.309 C 644.5 83.309 595.1 74.832 394.5 74.849 C 194.5 74.849 144.5 83.309 0 83.309 L 0 88.7 L 800 88.7 L 800 88.666 L 800 83.309 Z' fill='%23003F7C'/%3E%3C/svg%3E");
        mask-size: 1600px 120%;
        mask-repeat: repeat-x;
        animation-duration: 30s;
        animation-direction: reverse;
        z-index: 2;
    }

    .wave-three {
        height: 200px;
        background: linear-gradient(45deg, rgb(59, 130, 246), rgb(147, 51, 234));
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 98'%3E%3Cpath d='M 800 83.309 C 644.5 83.309 595.1 74.832 394.5 74.849 C 194.5 74.849 144.5 83.309 0 83.309 L 0 88.7 L 800 88.7 L 800 88.666 L 800 83.309 Z' fill='%23003F7C'/%3E%3C/svg%3E");
        mask-size: 1600px 120%;
        mask-repeat: repeat-x;
        animation-duration: 50s;
        z-index: 1;
    }



    @keyframes waveAnimation {
        0% {
            transform: translateX(0);
        }
        100% {
            transform: translateX(-2000px);
        }
    }
</style>