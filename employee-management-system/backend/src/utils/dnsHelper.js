const dns = require('dns');

// Ensure Node.js prefers IPv4 on Windows to avoid getaddrinfo ENOENT
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

async function resolveHost(host) {
  // If already an IP, return directly
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return host;

  // Step 1: Try OS DNS lookup with IPv4 forced
  try {
    const res = await dns.promises.lookup(host, { family: 4 });
    if (res && res.address) {
      console.log(`📡 Resolved ${host} via OS DNS: ${res.address}`);
      return res.address;
    }
  } catch (err) {
    console.warn(`⚠️ OS DNS lookup failed for ${host}: ${err.message}`);
  }

  // Step 2: Try public DNS (Google 8.8.8.8 / Cloudflare 1.1.1.1)
  try {
    const resolver = new dns.promises.Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);
    const addresses = await resolver.resolve4(host);
    if (addresses && addresses.length > 0) {
      console.log(`📡 Resolved ${host} via Public DNS: ${addresses[0]}`);
      return addresses[0];
    }
  } catch (err) {
    console.warn(`⚠️ Public DNS resolve failed for ${host}: ${err.message}`);
  }

  // Step 3: Hardcoded fallback IPs for standard providers if ISP/Wi-Fi blocks DNS
  const knownIps = {
    'smtp.gmail.com': '142.251.2.108',
    'smtp.mail.yahoo.com': '98.136.103.24',
    'smtp.office365.com': '52.96.166.146',
  };

  if (knownIps[host]) {
    console.log(`🛡️ Using reliable fallback IP for ${host}: ${knownIps[host]}`);
    return knownIps[host];
  }

  return host;
}

module.exports = { resolveHost };

