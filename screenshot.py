#!/usr/bin/env python3.11
"""Take screenshots of MusicBox pages for UI audit."""
import sys
from playwright.sync_api import sync_playwright

BASE = "https://musicbox.gornich.fun"
OUT_DIR = "/opt/musicbox/screenshots"

def screenshot(path="/", name="page", width=1440, height=900, mobile=False, full_page=False):
    """Take a screenshot of a page."""
    import os
    os.makedirs(OUT_DIR, exist_ok=True)
    
    with sync_playwright() as p:
        if mobile:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={"width": 375, "height": 812},
                device_scale_factor=2,
                is_mobile=True,
                ignore_https_errors=True,
            )
            width_tag = "mobile"
        else:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={"width": width, "height": height},
                ignore_https_errors=True,
            )
            width_tag = f"{width}"
        
        page = context.new_page()
        url = f"{BASE}{path}" if path.startswith("/") else path
        page.goto(url, wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(500)  # let animations settle
        
        filepath = f"{OUT_DIR}/{name}_{width_tag}.png"
        page.screenshot(path=filepath, full_page=full_page)
        print(f"Saved: {filepath}")
        
        browser.close()
        return filepath

if __name__ == "__main__":
    # Usage: python3.11 screenshot.py [path] [name] [width] [--mobile] [--full]
    path = sys.argv[1] if len(sys.argv) > 1 else "/"
    name = sys.argv[2] if len(sys.argv) > 2 else "page"
    mobile = "--mobile" in sys.argv
    full_page = "--full" in sys.argv
    width = 1440
    for arg in sys.argv:
        if arg.startswith("--width="):
            width = int(arg.split("=")[1])
    
    screenshot(path, name, width=width, mobile=mobile, full_page=full_page)
