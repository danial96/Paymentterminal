declare module "zkteco-js" {
  export default class ZKLib {
    constructor(ip: string, port: number, timeout: number, inport: number);
    createSocket(): Promise<void>;
    disconnect(): Promise<void>;
    getAttendances(): Promise<{ data: unknown[] }>;
    getUsers(): Promise<{ data: unknown[] }>;
    clearAttendanceLog(): Promise<void>;
  }
}
