import ZKLib from "zkteco-js";

export interface ZKAttendanceLog {
  userId: string;
  attTime: Date;
  verifyType: number;
  inOutStatus: number;
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
