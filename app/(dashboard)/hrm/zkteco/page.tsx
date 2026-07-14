"use client";

import { useState } from "react";
import { syncZKAttendance, getZKDeviceUsers } from "@/app/actions/zkteco";

export default function ZKTecoPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ synced: number; skipped: number; errors: string[] } | null>(null);
  const [users, setUsers] = useState<{ userId: string; name: string }[] | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div>
        <h1 className="text-2xl font-bold">ZKTeco Attendance Sync</h1>
        <p className="text-sm text-gray-500 mt-1">Device: 192.168.40.13 — K50 Fingerprint Terminal</p>
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
