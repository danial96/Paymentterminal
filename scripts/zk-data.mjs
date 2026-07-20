import ZKLib from "zkteco-js";

const IP = process.env.ZKTECO_IP || "192.168.40.13";
const PORT = parseInt(process.env.ZKTECO_PORT || "4370");

const zk = new ZKLib(IP, PORT, 5000, 5200);

async function main() {
  console.log(`\nConnecting to ZKTeco at ${IP}:${PORT}...\n`);
  await zk.createSocket();
  console.log("✓ Connected\n");

  // Users
  const usersRes = await zk.getUsers();
  const users = usersRes?.data || [];
  console.log(`=== USERS (${users.length}) ===`);
  users.forEach((u) => {
    console.log(`  UID: ${u.uid}  |  userId: ${u.userId}  |  Name: ${u.name}  |  Role: ${u.role}`);
  });

  // Attendance logs
  const attRes = await zk.getAttendances();
  const logs = attRes?.data || [];
  console.log(`\n=== ATTENDANCE LOGS (${logs.length} total, showing last 20) ===`);
  logs.slice(-20).forEach((l) => {
    console.log(`  user_id: ${l.user_id}  |  time: ${l.record_time}  |  state: ${l.state}  |  type: ${l.type}`);
  });

  await zk.disconnect();
  console.log("\n✓ Done\n");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
