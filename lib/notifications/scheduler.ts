import * as Notifications from 'expo-notifications';
import { Task } from '../../types/task';
import { requestNotificationPermission } from './permissions';

/**
 * Menjadwalkan notifikasi untuk sebuah task berdasarkan reminderAt.
 * @returns string | null (notificationId yang berhasil dijadwalkan)
 */
export async function scheduleTaskReminder(task: Task | (Omit<Task, "id"> & { id?: string })): Promise<string | null> {
  if (!task.reminderAt) return null;

  // Pastikan waktu reminder ada di masa depan
  const triggerDate = new Date(task.reminderAt);
  if (triggerDate.getTime() <= Date.now()) {
    return null;
  }

  // Cek/minta permission
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Task Reminder",
        body: task.title,
        data: { taskId: task.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
    return id;
  } catch (error) {
    console.error("Gagal menjadwalkan notifikasi:", error);
    return null;
  }
}

/**
 * Membatalkan notifikasi yang sudah dijadwalkan berdasarkan ID.
 */
export async function cancelTaskReminder(notificationId: string | null | undefined): Promise<void> {
  if (!notificationId) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error("Gagal membatalkan notifikasi:", error);
  }
}
