/**
 * QR Code Safety Analyzer Heuristics Engine
 */

const SUSPICIOUS_TLDS = new Set([
  'xyz', 'gq', 'cf', 'tk', 'ml', 'fit', 'cc', 'top', 'work', 'click', 
  'country', 'zip', 'mov', 'download', 'win', 'bid', 'loan', 'racing', 
  'date', 'stream', 'trade', 'accountant', 'cricket', 'faith'
]);

const URL_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'rebrand.ly', 'is.gd', 
  'buff.ly', 'adf.ly', 'ow.ly', 't.me', 'shorte.st', 'cutt.ly', 
  'lnky.in', 'lnk.to', 'short.io', 'tiny.cc', 'qr.ae', 'rb.gy', 'bit.do'
]);

const PHISHING_KEYWORDS = [
  'login', 'secure', 'bank', 'verify', 'wallet', 'signin', 'update', 
  'account', 'support', 'billing', 'confirm', 'password', 'credential', 
  'checkout', 'pay', 'auth', 'free', 'gift', 'claim', 'prize', 'verification',
  'recover', 'activity', 'suspended', 'security'
];

/**
 * Checks if a string is a valid HTTP/HTTPS URL
 * @param {string} str 
 * @returns {boolean}
 */
export function isUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

/**
 * Analyzes a URL and returns safety results (8 Heuristics Checklists)
 * @param {string} urlString 
 * @returns {object}
 */
export function analyzeUrl(urlString) {
  const results = {
    url: urlString,
    score: 0,
    status: 'safe',
    findings: []
  };

  let url;
  try {
    url = new URL(urlString);
  } catch (e) {
    results.status = 'invalid';
    results.findings.push({
      type: 'invalid_url',
      severity: 'high',
      message: 'Invalid Link Structure',
      tip: 'The payload structure could not be parsed as a website URL.'
    });
    return results;
  }

  const hostname = url.hostname.toLowerCase();
  const protocol = url.protocol.toLowerCase();
  const pathname = url.pathname.toLowerCase();
  const parts = hostname.split('.');

  // 1. Connection Encryption Check
  if (protocol === 'https:') {
    results.findings.push({
      type: 'protocol',
      severity: 'pass',
      message: 'Connection Encryption: Secure (HTTPS)',
      tip: 'The connection is encrypted using SSL/TLS, preventing unauthorized interception.'
    });
  } else {
    results.score += 25;
    results.findings.push({
      type: 'protocol',
      severity: 'medium',
      message: 'Connection Encryption: Insecure (HTTP)',
      tip: 'Traffic is sent in plain text and can be intercepted. Legitimate log-in portals almost always use HTTPS.'
    });
  }

  // 2. Host Type Check (IP Address vs Domain Name)
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  const ipv6Regex = /^\[?[0-9a-fA-F:]+\]?$/;
  const isRawIp = ipRegex.test(hostname) || ipv6Regex.test(hostname);
  
  if (isRawIp) {
    results.score += 35;
    results.findings.push({
      type: 'host_type',
      severity: 'high',
      message: 'Host Audit: Raw IP Address Detected',
      tip: 'Using numeric IP addresses instead of registered domain names is a strong indicator of temporary phishing setups.'
    });
  } else {
    results.findings.push({
      type: 'host_type',
      severity: 'pass',
      message: 'Host Audit: Domain Name Registered',
      tip: 'Uses a registered host domain name instead of a numeric IP address.'
    });
  }

  // 3. Link Masking / Shortener Check
  let isShortener = false;
  for (const shortener of URL_SHORTENERS) {
    if (hostname === shortener || hostname.endsWith('.' + shortener)) {
      isShortener = true;
      break;
    }
  }
  if (isShortener) {
    results.score += 20;
    results.findings.push({
      type: 'shortener',
      severity: 'low',
      message: 'Redirect Check: URL Shortener Detected',
      tip: 'Shortened links mask the final destination, making it difficult to review security hazards before visiting.'
    });
  } else {
    results.findings.push({
      type: 'shortener',
      severity: 'pass',
      message: 'Redirect Check: Direct Domain Link',
      tip: 'No link shortening wrappers were detected. This link goes directly to the listed host.'
    });
  }

  // 4. Domain TLD Security Check
  const tld = parts[parts.length - 1];
  if (SUSPICIOUS_TLDS.has(tld)) {
    results.score += 25;
    results.findings.push({
      type: 'tld_safety',
      severity: 'medium',
      message: `TLD Security: Suspicious Extension (.${tld})`,
      tip: `Cheap or free top-level domains like .${tld} are statistically much more common in automated phishing campaigns.`
    });
  } else {
    results.findings.push({
      type: 'tld_safety',
      severity: 'pass',
      message: `TLD Security: Standard Extension (.${tld})`,
      tip: 'The extension used is a standard global TLD with active domain-authority controls.'
    });
  }

  // 5. Subdomain Structural Check
  if (parts.length > 4 && !isRawIp) {
    results.score += 15;
    results.findings.push({
      type: 'subdomain_depth',
      severity: 'medium',
      message: 'Subdomain Audit: Excessive Subdomains',
      tip: 'Attackers create long subdomain hierarchies to disguise the real domain suffix (e.g. paypal.com.sign-in.attacker.xyz).'
    });
  } else {
    results.findings.push({
      type: 'subdomain_depth',
      severity: 'pass',
      message: 'Subdomain Audit: Safe Domain Hierarchy',
      tip: 'Structure is simple, using standard domain directories without excessive sub-level prefixes.'
    });
  }

  // 6. Phishing Keywords Check
  const flaggedKeywords = [];
  PHISHING_KEYWORDS.forEach(keyword => {
    const isMainDomain = parts.length >= 2 && 
      (parts[parts.length - 2] === keyword || (parts.length >= 3 && parts[parts.length - 3] === keyword));
    
    if (!isMainDomain) {
      if (hostname.includes(keyword) || pathname.includes(keyword)) {
        flaggedKeywords.push(keyword);
      }
    }
  });

  if (flaggedKeywords.length > 0) {
    const scoreIncrease = Math.min(flaggedKeywords.length * 15, 45);
    results.score += scoreIncrease;
    results.findings.push({
      type: 'phishing_keywords',
      severity: 'high',
      message: `Keywords Scan: Suspicious Terms Detected`,
      tip: `Contains credential triggers: ${flaggedKeywords.slice(0, 3).join(', ')}. Scammers inject brand names in subdomains to spoof identity.`
    });
  } else {
    results.findings.push({
      type: 'phishing_keywords',
      severity: 'pass',
      message: 'Keywords Scan: No Threat Signatures',
      tip: 'Found no suspicious banking, security-reset, or credential terms inside the URL directories.'
    });
  }

  // 7. Connection Port Check
  if (url.port && url.port !== '80' && url.port !== '443') {
    results.score += 15;
    results.findings.push({
      type: 'port_safety',
      severity: 'low',
      message: `Port Check: Custom Connection Port (${url.port})`,
      tip: 'Traffic routes through a non-standard port. Standard web connections use port 80 (HTTP) or 443 (HTTPS).'
    });
  } else {
    results.findings.push({
      type: 'port_safety',
      severity: 'pass',
      message: 'Port Check: Standard Connection Port',
      tip: 'Routes cleanly through default internet ports (HTTP 80 / HTTPS 443).'
    });
  }

  // 8. Spoofing & Homograph Check
  const isPunycode = hostname.startsWith('xn--');
  const hasUnicode = /[^\u0000-\u007F]/.test(url.hostname);
  if (isPunycode || hasUnicode) {
    results.score += 35;
    results.findings.push({
      type: 'homograph_safety',
      severity: 'high',
      message: 'Identity Audit: Unicode Spoofing Threat',
      tip: 'Domain contains mixed Cyrillic/Unicode characters that look identical to normal letters (homograph attack) to fake brand names.'
    });
  } else {
    results.findings.push({
      type: 'homograph_safety',
      severity: 'pass',
      message: 'Identity Audit: Standard Character Set',
      tip: 'Domain contains standard ASCII characters. No Unicode character mixing detected.'
    });
  }

  // Cap score at 100
  results.score = Math.min(results.score, 100);

  // Set overall status based on score thresholds
  if (results.score >= 50) {
    results.status = 'danger';
  } else if (results.score >= 20) {
    results.status = 'suspicious';
  } else {
    results.status = 'safe';
  }

  return results;
}
