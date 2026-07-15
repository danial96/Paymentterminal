"use client";

import { useState, useEffect } from "react";
import { syncZKAttendance, getZKDeviceUsers, debugZKLogs, getPendingFingerprintEmployees } from "@/app/actions/zkteco";

export default function ZKTecoPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ synced: number; skipped: number; errors: string[] } | null>(null);
  const [users, setUsers] = useState<{ userId: string; name: string }[] | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[] | null>(null);
  const [debugging, setDebugging] = useState(false);
  const [pendingEmployees, setPendingEmployees] = useState<{ id: number; firstName: string; lastName: string; employeeId: string; createdAt: Date }[]>([]);
  const [liveStatus, setLiveStatus] = useState<"connecting" | "live" | "fallback" | "error">("connecting");
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    getPendingFingerprintEmployees().then(setPendingEmployees).catch(() => {});
  }, [result]);

  // Auto-sync function
  const autoSync = async () => {
    try {
      const res = await syncZKAttendance();
      if (res.synced > 0) {
        setResult(res);
        setLastSyncTime(new Date().toLocaleTimeString());
        getPendingFingerprintEmployees().then(setPendingEmployees).catch(() => {});
      }
    } catch {}
  };

  // Real-time SSE + 2 min fallback
  useEffect(() => {
    let fallbackInterval: ReturnType<typeof setInterval>;
    let es: EventSource;

    function startFallback() {
      setLiveStatus("fallback");
      fallbackInterval = setInterval(autoSync, 2 * 60 * 1000);
    }

    function connectSSE() {
      setLiveStatus("connecting");
      es = new EventSource("/api/hrm/zkteco/realtime");

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "connected") setLiveStatus("live");
          if (data.type === "punch") autoSync();
          if (data.type === "error") { es.close(); startFallback(); }
        } catch {}
      };

      es.onerror = () => {
        es.close();
        // SSE auto-reconnects after 90s server close — but start fallback too
        startFallback();
        // Retry SSE after 30s
        setTimeout(() => {
          clearInterval(fallbackInterval);
          connectSSE();
        }, 30_000);
      };
    }

    connectSSE();

    return () => {
      es?.close();
      clearInterval(fallbackInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    setError(null);
    try {
      const res = await syncZKAttendance();
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDebug() {
    setDebugging(true);
    setError(null);
    try {
      const res = await debugZKLogs();
      setDebugLogs(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Debug failed");
    } finally {
      setDebugging(false);
    }
  }

  async function handleLoadUsers() {
    setLoadingUsers(true);
    setError(null);
    try {
      const res = await getZKDeviceUsers();
      setUsers(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setLoadingUsers(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">ZKTeco Attendance Sync</h1>
          <p className="text-sm text-gray-500 mt-1">Device: 192.168.40.13 — K50 Fingerprint Terminal</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            liveStatus === "live" ? "bg-green-100 text-green-700" :
            liveStatus === "fallback" ? "bg-yellow-100 text-yellow-700" :
            liveStatus === "connecting" ? "bg-blue-100 text-blue-600" :
            "bg-red-100 text-red-600"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              liveStatus === "live" ? "bg-green-500 animate-pulse" :
              liveStatus === "fallback" ? "bg-yellow-500 animate-pulse" :
              liveStatus === "connecting" ? "bg-blue-500 animate-pulse" :
              "bg-red-500"
            }`} />
            {liveStatus === "live" ? "Live" :
             liveStatus === "fallback" ? "Auto (2 min)" :
             liveStatus === "connecting" ? "Connecting..." : "Offline"}
          </span>
          {lastSyncTime && <span className="text-xs text-gray-400">Last sync: {lastSyncTime}</span>}
        </div>
      </div>

      {/* Sync Attendance */}
      <div className="border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-lg">Sync Attendance Logs</h2>
        <p className="text-sm text-gray-500">
          Machine se attendance records pull karke HRM mein import karega. Check-in/check-out automatically set hoga.
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {syncing ? "Syncing..." : "Sync Now"}
        </button>

        {result && (
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex gap-6 text-sm">
              <span className="text-green-600 font-medium">✓ Synced: {result.synced}</span>
              <span className="text-gray-500">Skipped: {result.skipped}</span>
              {result.errors.length > 0 && (
                <span className="text-red-500">Errors: {result.errors.length}</span>
              )}
            </div>
            {result.errors.length > 0 && (
              <ul className="text-xs text-red-500 space-y-1 mt-2">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Pending Fingerprint Enrollment */}
      {pendingEmployees.length > 0 && (
        <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-5 space-y-3">
          <h2 className="font-semibold text-lg text-yellow-800">⏳ Fingerprint Pending ({pendingEmployees.length})</h2>
          <p className="text-sm text-yellow-700">Yeh employees machine par register hain lekin abhi tak finger enroll nahi ki. Inhe machine par jakar finger lagani hai.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-yellow-700 border-b border-yellow-200">
                  <th className="pb-2">Employee ID</th>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Added On</th>
                </tr>
              </thead>
              <tbody>
                {pendingEmployees.map((e) => (
                  <tr key={e.id} className="border-b border-yellow-100 last:border-0">
                    <td className="py-2 font-mono text-yellow-800">{e.employeeId}</td>
                    <td className="py-2">{e.firstName} {e.lastName}</td>
                    <td className="py-2 text-yellow-600">{new Date(e.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Debug Raw Logs */}
      <div className="border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-lg">Debug: Raw Attendance Logs</h2>
        <p className="text-sm text-gray-500">Machine se pehle 5 raw log records dekho — userId format check karne ke liye.</p>
        <button
          onClick={handleDebug}
          disabled={debugging}
          className="bg-yellow-600 text-white px-5 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 font-medium"
        >
          {debugging ? "Loading..." : "Show Raw Logs"}
        </button>
        {debugLogs && (
          <div className="space-y-1">
            {debugLogs.map((l, i) => (
              <pre key={i} className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">{l}</pre>
            ))}
          </div>
        )}
      </div>

      {/* Device Users */}
      <div className="border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-lg">Device Users</h2>
        <p className="text-sm text-gray-500">
          Machine par registered fingerprint users dekho. Employee ID machine ke User ID se match hona chahiye.
        </p>
        <button
          onClick={handleLoadUsers}
          disabled={loadingUsers}
          className="bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 font-medium"
        >
          {loadingUsers ? "Loading..." : "Load Users from Device"}
        </button>

        {users && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2 border-b">User ID</th>
                  <th className="text-left p-2 border-b">Name</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-2 font-mono">{u.userId}</td>
                    <td className="p-2">{u.name || "—"}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={2} className="p-4 text-center text-gray-400">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}
