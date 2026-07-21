import ZKLib from "zkteco-js";
import { execFile } from "child_process";
import path from "path";

export interface ZKFingerStatus {
  userId: string;
  uid: number;
  name: string;
  enrolled: boolean;
  fingerCount: number;
  fingerIds: number[];
}

function runPythonSync(command: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const script = path.join(process.cwd(), "scripts", "zk_sync.py");
    execFile("python", [script, command], { timeout: 30000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error("Invalid JSON from zk_sync.py: " + stdout.slice(0, 200)));
      }
    });
  });
}

export async function getZKFingerStatus(): Promise<ZKFingerStatus[]> {
  const data = await runPythonSync("finger_status");
  if (Array.isArray(data)) return data as ZKFingerStatus[];
  throw new Error((data as { error: string }).error || "Failed to get finger status");
}

export async function getZKAttendanceViaPython(): Promise<{ userId: string; timestamp: string; status: number; punch: number }[]> {
  const data = await runPythonSync("attendance");
  if (Array.isArray(data)) return data as { userId: string; timestamp: string; status: number; punch: number }[];
  throw new Error((data as { error: string }).error || "Failed to get attendance");
}

export interface ZKAttendanceLog {
  sn: number;
  user_id: string;
  record_time: string;
  type: number;
  state: number;
  ip: string;
}

export interface ZKUser {
  uid: number;
  userId: string;
  name: string;
  password: string;
  role: number;
  cardno: number;
}

const ZKTECO_IP = process.env.ZKTECO_IP || "192.168.40.13";
const ZKTECO_PORT = parseInt(process.env.ZKTECO_PORT || "4370");
const ZKTECO_TIMEOUT = 5000;
const ZKTECO_INPORT = 5200;

export async function getZKAttendanceLogs(): Promise<ZKAttendanceLog[]> {
  const zk = new ZKLib(ZKTECO_IP, ZKTECO_PORT, ZKTECO_TIMEOUT, ZKTECO_INPORT);
  try {
    await zk.createSocket();
    const data = await zk.getAttendances();
    await zk.disconnect();
    return (data?.data || []) as ZKAttendanceLog[];
  } catch (err) {
    try { await zk.disconnect(); } catch {}
    throw err;
  }
}

export async function getZKUsers(): Promise<ZKUser[]> {
  const zk = new ZKLib(ZKTECO_IP, ZKTECO_PORT, ZKTECO_TIMEOUT, ZKTECO_INPORT);
  try {
    await zk.createSocket();
    const data = await zk.getUsers();
    await zk.disconnect();
    return (data?.data || []) as ZKUser[];
  } catch (err) {
    try { await zk.disconnect(); } catch {}
    throw err;
  }
}

export async function pushUserToZK(uid: number, userId: string, name: string): Promise<void> {
  const zk = new ZKLib(ZKTECO_IP, ZKTECO_PORT, ZKTECO_TIMEOUT, ZKTECO_INPORT);
  try {
    await zk.createSocket();
    await zk.setUser(uid, userId, name, "", 0, 0);
    await zk.disconnect();
  } catch (err) {
    try { await zk.disconnect(); } catch {}
    throw err;
  }
}

export async function startFingerprintEnrollment(uid: number, name: string, userId: string): Promise<void> {
  const zk = new ZKLib(ZKTECO_IP, ZKTECO_PORT, ZKTECO_TIMEOUT, ZKTECO_INPORT);
  try {
    await zk.createSocket();
    // Delete existing user so machine assigns the fingerprint to this exact UID
    try { await (zk as any).deleteUser(uid); } catch {}
    // Small delay for machine to process deletion
    await new Promise(r => setTimeout(r, 500));
    // CMD_STARTENROLL = 61 — triggers enrollment mode for given UID
    const buf = Buffer.alloc(4);
    buf.writeUInt16LE(uid, 0);
    buf.writeUInt16LE(0, 2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (zk as any).ztcp.executeCmd(61, buf);
    await zk.disconnect();
  } catch (err) {
    try { await zk.disconnect(); } catch {}
    throw err;
  }
}

export async function deleteZKUser(uid: number): Promise<void> {
  const zk = new ZKLib(ZKTECO_IP, ZKTECO_PORT, ZKTECO_TIMEOUT, ZKTECO_INPORT);
  try {
    await zk.createSocket();
    await (zk as any).deleteUser(uid);
    await zk.disconnect();
  } catch (err) {
    try { await zk.disconnect(); } catch {}
    throw err;
  }
}

export async function clearZKAttendanceLogs(): Promise<void> {
  const zk = new ZKLib(ZKTECO_IP, ZKTECO_PORT, ZKTECO_TIMEOUT, ZKTECO_INPORT);
  try {
    await zk.createSocket();
    await zk.clearAttendanceLog();
    await zk.disconnect();
  } catch (err) {
    try { await zk.disconnect(); } catch {}
    throw err;
  }
}
