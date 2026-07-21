import ZKLib from 'zkteco-js';

const zk = new ZKLib('192.168.40.13', 4370, 5000, 5200);
await zk.createSocket();
const data = await zk.getAttendances();
await zk.disconnect();

const logs = (data?.data || []).slice(-5);
console.log('Last 5 punches (Node.js raw):');
for (const l of logs) {
  console.log(JSON.stringify(l));
}
