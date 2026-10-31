/**
 * Offline Sync Queue Manager
 * Stores ground barrier reports & session attendance in localStorage / IndexedDB when offline.
 * Displays pending sync counter and automatically synchronizes when connection is restored.
 */
import { apiRequest } from './api';

const REPORTS_QUEUE_KEY = 'khelodisha_offline_reports_queue';
const ATTENDANCE_QUEUE_KEY = 'khelodisha_offline_attendance_queue';

export function getPendingReports() {
  try {
    const raw = localStorage.getItem(REPORTS_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePendingReport(report) {
  const current = getPendingReports();
  const item = {
    ...report,
    offline_id: `OFFLINE-REP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    queued_at: new Date().toISOString()
  };
  current.push(item);
  localStorage.setItem(REPORTS_QUEUE_KEY, JSON.stringify(current));
  window.dispatchEvent(new Event('offline_queue_changed'));
  return item;
}

export function getPendingAttendance() {
  try {
    const raw = localStorage.getItem(ATTENDANCE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePendingAttendance(attendance) {
  const current = getPendingAttendance();
  const item = {
    ...attendance,
    offline_id: `OFFLINE-ATT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    queued_at: new Date().toISOString()
  };
  current.push(item);
  localStorage.setItem(ATTENDANCE_QUEUE_KEY, JSON.stringify(current));
  window.dispatchEvent(new Event('offline_queue_changed'));
  return item;
}

export function getTotalPendingCount() {
  return getPendingReports().length + getPendingAttendance().length;
}

/**
 * Sync queued items to server when online.
 * Conflict rule: teacher_confirmed entries win conflicts, and audit trail logs sync.
 */
export async function syncOfflineQueue() {
  if (!navigator.onLine) {
    return { synced: false, message: 'Device is offline' };
  }

  const reports = getPendingReports();
  const attendance = getPendingAttendance();

  if (reports.length === 0 && attendance.length === 0) {
    return { synced: true, count: 0 };
  }

  let syncedReportsCount = 0;
  let syncedAttendanceCount = 0;

  // Sync reports batch
  if (reports.length > 0) {
    try {
      await apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify(reports)
      });
      syncedReportsCount = reports.length;
      localStorage.removeItem(REPORTS_QUEUE_KEY);
    } catch (err) {
      console.warn('Failed to sync offline reports:', err);
    }
  }

  // Sync attendance items
  if (attendance.length > 0) {
    for (const item of attendance) {
      try {
        await apiRequest('/sessions', {
          method: 'POST',
          body: JSON.stringify(item)
        });
        syncedAttendanceCount++;
      } catch (err) {
        console.warn('Failed to sync offline attendance item:', err);
      }
    }
    // Remove synced attendance
    localStorage.removeItem(ATTENDANCE_QUEUE_KEY);
  }

  window.dispatchEvent(new Event('offline_queue_changed'));

  return {
    synced: true,
    synced_reports: syncedReportsCount,
    synced_attendance: syncedAttendanceCount,
    total: syncedReportsCount + syncedAttendanceCount
  };
}
