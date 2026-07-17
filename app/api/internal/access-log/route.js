import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export const runtime = "nodejs";

const LOG_FILE = path.join(process.cwd(), "access-log.json");

function readLog() {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    const raw = fs.readFileSync(LOG_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeLog(entries) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

export async function POST(req) {
  try {
    const body = await req.json();
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const hostname = os.hostname();

    const entry = {
      timestamp: new Date().toISOString(),
      ip,
      hostname,
      userAgent,
      path: body.path || "/",
      user: body.user || null,
      event: body.event || "page_visit",
    };

    const logs = readLog();
    logs.push(entry);
    // Simpan max 5000 entri terakhir
    if (logs.length > 5000) logs.splice(0, logs.length - 5000);
    writeLog(logs);

    // Juga cetak ke server console agar terlihat di terminal
    console.log(
      `[ACCESS-LOG] ${entry.timestamp} | IP: ${ip} | HOST: ${hostname} | PATH: ${entry.path} | UA: ${userAgent.slice(0, 80)}`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ACCESS-LOG] Error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  try {
    const logs = readLog();
    return NextResponse.json({ total: logs.length, logs });
  } catch {
    return NextResponse.json({ total: 0, logs: [] });
  }
}
