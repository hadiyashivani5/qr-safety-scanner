========================================================================
                     QR CODE SAFETY CHECKER
========================================================================

An advanced, premium client-side web application designed to scan, audit, 
and generate QR codes securely. This tool focuses on privacy and security, 
allowing users to verify link destinations, preview sites safely, and 
encrypt payloads client-side.

------------------------------------------------------------------------
1. CORE FEATURES & HOW THEY WORK
------------------------------------------------------------------------

* LIVE SCANNER & FILE UPLOAD
  - Live Camera: Uses the webcam to scan physical QR codes in real-time.
  - Image Upload: Allows users to drag and drop or browse local image files 
    (PNG, JPG, WebP). It loads the image onto an offscreen canvas and decodes
    the pixels using 'jsQR' to bypass browser DOM restrictions.

* LOCAL SAFETY HEURISTICS ENGINE
  - When a URL is parsed, the app runs 8 strict heuristics security audits:
    1. Protocol Check: Flags insecure HTTP links.
    2. IP Address check: Flags URLs utilizing numeric IP hosts.
    3. Shortener check: Identifies known wrapper links.
    4. Suspicious TLD check: Flags domains hosted on spam-heavy extensions.
    5. Subdomain check: Detects phishing subdomains (>3 levels).
    6. Keyword check: Flags credential-stealing words (e.g. login, verify, bank).
    7. Custom Ports: Flags links pointing to non-standard ports.
    8. Homograph attack check: Detects Punycode spoofing of major brands.
  - Outputs a "Threat Risk Index" score from 0 (Safe) to 100 (Dangerous).

* URL REDIRECT AUDITOR (UNSHORTENER)
  - Shortened URLs (like bit.ly) are often used to mask phishing destinations.
  - When a shortened link is scanned, the app routes it through a CORS-friendly 
    proxy resolver to find the true, final destination.
  - It runs the 8 safety heuristics audits on the final destination URL rather 
    than just checking the shortener wrapper.

* NATIVE WI-FI QR SCANNER & CREATOR
  - Scans WIFI configurations: Instantly parses SSID, Security (WPA/WEP/Open), 
    password, and hidden flags.
  - Wi-Fi Diagnostics Card: Displays the SSID, security type, and an 
    interactive password box with hide/show toggles, copy buttons for BOTH 
    the SSID name and the password key.
  - Connection Guide: Appends a visual step-by-step help card detailing how 
    to connect using a smartphone camera or manually. Includes a specialized 
    walkthrough on adding hidden network SSIDs.
  - Wi-Fi Heuristics: Flags insecure open (passwordless) networks and WEP, 
    and checks password strength.
  - Wi-Fi Generator: Create custom styled Wi-Fi access codes directly in the 
    generator panel.

* VISUAL SANDBOX PREVIEWS
  - For audited URLs, the app queries the Microlink API to fetch a static
    image screenshot of the landing page.
  - Users can visually verify the destination page (to check for fake login 
    forms) without loading the website locally or executing malicious scripts.

* PASSWORD-PROTECTED (ENCRYPTED) QR CODES
  - Generator: Encrypts URL or text inputs locally using AES-256 (via CryptoJS)
    with a password entered by the user. The output payload is prefixed with 
    'AES-QR:'.
  - Scanner: When the uploader/camera reads an 'AES-QR:' payload, it intercepts 
    display, shows a locked vault screen, prompts for the passcode, and decrypts 
    contents client-side before running safety scans.

* CUSTOM DESIGNER QR GENERATOR
  - Draws premium high-resolution canvas codes using 'qr-code-styling'.
  - Offers custom dot shapes (classy, rounded, square), custom corner frames, 
    independent color pickers, transparent backgrounds, and branding logos 
    with size and safety margin sliders.
  - Supports downloads as PNG (raster) or SVG (vector).

* PDF SECURITY REPORT EXPORTER
  - Generates diagnostic reports locally via 'jsPDF'.
  - Includes verdict color badges, scan dates, formatted threat indexes, and the 
    checklist of the 8 audited parameters sorted with issues at the top.

------------------------------------------------------------------------
2. PROJECT FILE ARCHITECTURE
------------------------------------------------------------------------

* index.html      - Glassmorphic interface layout, tabs, settings accordions, 
                    and external CDN library scripts (Lucide, jsQR, jsPDF, CryptoJS).
* style.css       - Clean CSS design rules, hover states, animations, loading 
                    spinners, and responsive mobile flex grids.
* app.js          - Event controllers, DOM mappings, camera inputs, encryption/decryption 
                    triggers, unshortener proxy pipelines, and PDF drawer loops.
* analyzer.js     - Main heuristic engine defining string parsing regex tests, TLD 
                    checklists, and safety risk score multipliers.
* package.json    - Project dependency descriptors and local dev start scripts.
* readme.txt      - This documentation guide sheet.

------------------------------------------------------------------------
3. HOW TO START & VERIFY
------------------------------------------------------------------------

1. Spin up the local development server:
   - Run in your terminal:
     python -m http.server 8000
   - Or run via npm scripts:
     npm run dev

2. Open your web browser and navigate to:
   http://localhost:8000

3. Testing Checklist:
   - Test Wi-Fi: Generate a Wi-Fi code (WPA, password: 'mypassword'), download 
     the image, upload it in the scanner, and unlock/copy credentials.
   - Test Encryption: Toggle 'Enable Password Protection' in the generator, set 
     a key, download it, upload it, enter the key, and verify it decrypts and scans.
   - Test Unshortener: Enter a shortened link (like http://google.com or a bit.ly URL) 
     in manual input to trigger redirect resolution, visual sandbox screenshot capture, 
     and safety checklists.
========================================================================
