#!/usr/bin/env node
/**
 * © 2025 Joshtri Lenggu — E-Learning YOTM
 * Script untuk melihat log akses sistem.
 * Jalankan: node scripts/view-access-log.js
 */

const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "..", "access-log.json");

if (!fs.existsSync(LOG_FILE)) {
  console.log("Belum ada log akses. Jalankan aplikasi terlebih dahulu.");
  process.exit(0);
}

const logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));

console.log("=".repeat(80));
console.log("  © 2025 Joshtri Lenggu — E-Learning YOTM | ACCESS LOG VIEWER");
console.log("=".repeat(80));
console.log(`Total entri: ${logs.length}\n`);

// Tampilkan 50 log terakhir
const recent = logs.slice(-50).reverse();
recent.forEach((entry, i) => {
  console.log(`[${i + 1}] ${entry.timestamp}`);
  console.log(`     IP       : ${entry.ip}`);
  console.log(`     Hostname : ${entry.hostname}`);
  console.log(`     Path     : ${entry.path}`);
  console.log(`     Event    : ${entry.event}`);
  console.log(`     UA       : ${entry.userAgent?.slice(0, 80)}`);
  console.log();
});

// Ringkasan IP unik
const uniqueIPs = [...new Set(logs.map((l) => l.ip))];
console.log("=".repeat(80));
console.log(`IP unik yang pernah akses (${uniqueIPs.length}):`);
uniqueIPs.forEach((ip) => {
  const count = logs.filter((l) => l.ip === ip).length;
  console.log(`  ${ip.padEnd(20)} — ${count} kali`);
});

// Deteksi DevTools
const devtoolsEvents = logs.filter((l) => l.event === "devtools_opened");
if (devtoolsEvents.length > 0) {
  console.log("\n⚠️  PERINGATAN — DevTools pernah dibuka:");
  devtoolsEvents.forEach((e) => {
    console.log(`  ${e.timestamp} | IP: ${e.ip} | Path: ${e.path}`);
  });
}
console.log("=".repeat(80));
