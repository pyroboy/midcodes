"""
Hack: Grab all fbcdn.net image URLs from the current Brave page via CDP,
then download the largest ones (full-res meter photos).

Run while the Facebook slideshow/media page is open in Brave.
"""
import asyncio
import base64
import hashlib
import json
import re
from pathlib import Path
from datetime import datetime
from playwright.async_api import async_playwright

DOWNLOAD_FOLDER = Path.home() / "Downloads" / "meter_readings"
CDP_ENDPOINT = "http://localhost:9222"
MIN_WIDTH = 300  # Only grab images wider than this (skip thumbnails/avatars)


async def main():
    DOWNLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as pw:
        browser = await pw.chromium.connect_over_cdp(CDP_ENDPOINT)
        context = browser.contexts[0]

        # Find the Facebook page
        fb_page = None
        for p in context.pages:
            if "facebook.com" in p.url:
                fb_page = p
                print(f"✓ Found Facebook page: {p.url[:80]}")
                break

        if not fb_page:
            print("✗ No Facebook page open in Brave!")
            return

        # ── STEP 1: Dump ALL fbcdn.net URLs from the entire DOM ──────────────
        print("\n🔍 Scanning DOM for all fbcdn.net image URLs...")
        result = await fb_page.evaluate("""
            () => {
                const found = new Map(); // url -> {width, height, tag}

                // From <img> tags
                document.querySelectorAll('img[src*="fbcdn.net"]').forEach(img => {
                    const url = img.src;
                    const w = img.naturalWidth || img.width || img.offsetWidth;
                    const h = img.naturalHeight || img.height || img.offsetHeight;
                    if (!found.has(url) || found.get(url).width < w) {
                        found.set(url, { width: w, height: h, tag: 'img' });
                    }
                });

                // From srcset attributes
                document.querySelectorAll('img[srcset]').forEach(img => {
                    img.srcset.split(',').forEach(entry => {
                        const parts = entry.trim().split(' ');
                        const url = parts[0];
                        if (url && url.includes('fbcdn.net')) {
                            const w = parseInt(parts[1]) || 0;
                            if (!found.has(url) || found.get(url).width < w) {
                                found.set(url, { width: w, height: 0, tag: 'srcset' });
                            }
                        }
                    });
                });

                // From background-image styles
                document.querySelectorAll('*').forEach(el => {
                    const bg = window.getComputedStyle(el).backgroundImage;
                    if (bg && bg.includes('fbcdn.net')) {
                        const m = bg.match(/url\\(["']?([^"')]+)["']?\\)/);
                        if (m) {
                            const url = m[1];
                            const w = el.offsetWidth;
                            if (!found.has(url) || found.get(url).width < w) {
                                found.set(url, { width: w, height: el.offsetHeight, tag: 'bg' });
                            }
                        }
                    }
                });

                // Convert to array sorted by width desc
                return [...found.entries()]
                    .map(([url, info]) => ({ url, ...info }))
                    .sort((a, b) => b.width - a.width);
            }
        """)

        print(f"  Found {len(result)} total fbcdn.net URLs in DOM\n")

        # Show them all
        for i, item in enumerate(result):
            print(f"  [{i:02d}] {item['width']}x{item['height']} ({item['tag']}) {item['url'][:80]}...")

        # ── STEP 2: Filter to likely full-res photos ─────────────────────────
        # Dedupe by boosting to highest-res variant of each image
        # FB URL pattern: replace small size hints with large ones
        def boost_url(url):
            url = re.sub(r'_[sn]\.(jpg|png|webp)', r'_n.\1', url)
            url = re.sub(r'p\d+x\d+/', 'p1080x1080/', url)
            return url

        candidates = []
        seen_hashes = set()
        for item in result:
            if item['width'] < MIN_WIDTH:
                continue
            # Skip profile pics / icons (small square images)
            if 'emoji' in item['url'] or 'safe_image' in item['url']:
                continue
            boosted = boost_url(item['url'])
            # Dedupe by base path (strip query params for comparison)
            base = item['url'].split('?')[0].split('_')[0][:60]
            if base in seen_hashes:
                continue
            seen_hashes.add(base)
            candidates.append(boosted)

        print(f"\n📸 {len(candidates)} candidate full-res photo URLs after filtering:\n")
        for i, url in enumerate(candidates):
            print(f"  [{i+1}] {url[:100]}...")

        if not candidates:
            print("\n✗ No candidates found. Try scrolling the media page or opening the slideshow first.")
            return

        # ── STEP 3: Download each ────────────────────────────────────────────
        print(f"\n⬇  Downloading {len(candidates)} images to {DOWNLOAD_FOLDER}...\n")

        downloaded = 0
        for i, url in enumerate(candidates, 1):
            url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
            filename = f"meter_{i:03d}_{url_hash}.jpg"
            filepath = DOWNLOAD_FOLDER / filename

            if filepath.exists():
                print(f"  [{i:02d}] ⏭  Skip (exists): {filename}")
                continue

            try:
                img_b64 = await fb_page.evaluate("""
                    async (url) => {
                        const r = await fetch(url, { credentials: 'include' });
                        if (!r.ok) return null;
                        const buf = await r.arrayBuffer();
                        const bytes = new Uint8Array(buf);
                        let bin = '';
                        bytes.forEach(b => bin += String.fromCharCode(b));
                        return btoa(bin);
                    }
                """, url)

                if img_b64:
                    data = base64.b64decode(img_b64)
                    filepath.write_bytes(data)
                    size_kb = len(data) // 1024
                    print(f"  [{i:02d}] ✓ {filename} ({size_kb} KB)")
                    downloaded += 1
                else:
                    print(f"  [{i:02d}] ✗ fetch returned null for: {url[:60]}")
            except Exception as e:
                print(f"  [{i:02d}] ✗ Error: {e}")

        print(f"\n{'='*50}")
        print(f"  ✅ Done! Downloaded {downloaded}/{len(candidates)} images")
        print(f"  📁 {DOWNLOAD_FOLDER}")
        print(f"{'='*50}\n")


if __name__ == "__main__":
    asyncio.run(main())
