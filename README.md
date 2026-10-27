# 🛡️ QR Code Safety Checker & Secure Generator

An advanced, privacy-first, 100% client-side web application designed to scan, audit, trace, and generate QR codes with local heuristics-based security scoring.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Vanilla JS](https://img.shields.io/badge/Frontend-Vanilla%20JS%20%7C%20HTML5%20%7C%20CSS3-yellow.svg)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-brightgreen.svg)
![No Login Required](https://img.shields.io/badge/Auth-Zero%20Login-blueviolet.svg)

---

## ✨ Features

- **📷 Real-Time Camera Scanner**: Scan physical QR codes using any device camera with live preview.
- **📁 File Dropzone / Image Upload**: Drag & drop or browse image files (PNG, JPG, WebP) to decode QR codes in-memory.
- **🔎 Local Security Heuristics (8 Safety Rules)**:
  1. *Protocol Security*: Checks for unencrypted HTTP vs HTTPS.
  2. *IP Address Detection*: Flags URLs pointing directly to numeric IP addresses.
  3. *Shortener Detection*: Identifies URL shorteners often used to mask phishing links.
  4. *Suspicious TLD Check*: Flags risky or spam-associated top-level domains.
  5. *Subdomain Analysis*: Detects excessive subdomain nesting common in phishing campaigns.
  6. *Credential Theft Keywords*: Flags deceptive words (login, verify, secure, bank, etc.).
  7. *Non-Standard Ports*: Flags URLs targeting irregular network ports.
  8. *Homograph / Punycode Check*: Identifies spoofed domain names imitating popular brands.
- **🔗 URL Redirect / Unshortener Tracer**: Traces shortened links to expose true destination endpoints before visiting.
- **🔒 AES-256 Encrypted QR Codes**: Password-protect and decrypt sensitive QR payloads directly in browser memory.
- **🎨 Custom Designer QR Generator**: Customize dot shapes, corner squares, color themes, backgrounds, and brand logo embedding.
- **📄 PDF Security Audit Report**: One-click export of structured security audit certificates with threat scores and risk breakdowns.
- **📱 Fully Responsive**: 100% mobile-friendly design with touch optimization and zero installation required.

---

## 🔒 Privacy & Architecture

- **100% Local Execution**: All cryptographic operations, image decoding, and safety heuristic evaluations run in local browser memory.
- **Zero Cloud Storage**: Scanned contents and generated codes never leave your device.
- **No Login / Account Required**: Ready to use instantly without registration.

---

## 🚀 Live Demo & Deployment via GitHub Pages

This project is a pure static web application (HTML, CSS, JavaScript) and runs out-of-the-box on **GitHub Pages**.

### How to Deploy on GitHub Pages:

1. Create a new repository on [GitHub](https://github.com/new).
2. Push this project code to your repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
3. Go to **Settings** > **Pages** in your GitHub repository.
4. Under **Branch**, select `main` and root `/`, then click **Save**.
5. Within 1-2 minutes, your website will be live at:
   ```
   https://<your-username>.github.io/<your-repo-name>/
   ```

---

## 💻 Local Development

Run locally using any static web server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server . -p 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 📄 License

This project is licensed under the MIT License - feel free to use and modify for personal and educational purposes.
