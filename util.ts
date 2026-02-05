const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function safeRead(path: string, fallback = "") {
  try {
    return await Deno.readTextFile(path);
  } catch {
    return fallback;
  }
}

/* ---------------- CPU CORES ---------------- */
function getCores() {
  return navigator.hardwareConcurrency ?? 1;
}

/* ---------------- CPU TEMP ---------------- */
async function getTemp() {
  const raw = await safeRead(
    "/sys/class/thermal/thermal_zone0/temp",
    "0",
  );

  return Number(raw) ? Number(raw) / 1000 : null;
}

/* ---------------- MEMORY ---------------- */
async function getMemory() {
  const mem = await safeRead("/proc/meminfo");

  if (!mem) return null;

  const total = Number(mem.match(/MemTotal:\s+(\d+)/)?.[1]);
  const free = Number(mem.match(/MemAvailable:\s+(\d+)/)?.[1]);

  if (!total || !free) return null;

  return {
    totalMB: Math.round(total / 1024),
    usedMB: Math.round((total - free) / 1024),
  };
}

/* ---------------- LOAD ---------------- */
async function getLoad() {
  const load = await safeRead("/proc/loadavg");

  if (!load) return null;

  return load.split(" ").slice(0, 3).map(Number);
}

/* ---------------- UPTIME ---------------- */
async function getUptime() {
  const up = await safeRead("/proc/uptime");

  if (!up) return null;

  return Math.round(Number(up.split(" ")[0]) / 60);
}

/* ---------------- CPU USAGE ---------------- */
async function readStat() {
  const text = await safeRead("/proc/stat");

  if (!text) return null;

  const parts = text.split("\n")[0].trim().split(/\s+/).slice(1).map(Number);

  const idle = parts[3] + parts[4];
  const total = parts.reduce((a, b) => a + b, 0);

  return { idle, total };
}

async function getCpuUsage(delay = 400) {
  const t1 = await readStat();
  if (!t1) return null;

  await sleep(delay);

  const t2 = await readStat();
  if (!t2) return null;

  const idle = t2.idle - t1.idle;
  const total = t2.total - t1.total;

  return +(100 * (1 - idle / total)).toFixed(2);
}

export async function getSystemStats() {
  const memory = await getMemory();
  const loadAvg = await getLoad();
  return {
    cores: getCores(),
    cpuUsage: (await getCpuUsage()) ?? 0,
    temperature: (await getTemp()) ?? 0,
    memory: memory ?? { totalMB: 0, usedMB: 0 },
    loadAvg: loadAvg ?? [0, 0, 0],
    uptimeMinutes: (await getUptime()) ?? 0,
  };
}
