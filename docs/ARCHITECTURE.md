# Arsitektur Aplikasi To-Do List (Working Title)

> Aplikasi to-do list mobile (Android via Expo) dengan reminder lokal, UI/UX minimalist-premium, dan interaksi non-standar (swipe, drag-reorder, micro-animation).

---

## 1. Tech Stack Final

| Layer | Teknologi | Fungsi |
|---|---|---|
| Framework | React Native (Expo) | Build & run aplikasi Android |
| Language | TypeScript | Type safety |
| Routing | Expo Router | Navigasi file-based |
| Styling | NativeWind | Utility-first styling ala Tailwind |
| State | Zustand + `persist` middleware | State global (task list, filter, theme) |
| Local DB | Expo SQLite (+ Drizzle ORM opsional) | Penyimpanan task permanen |
| Settings storage | AsyncStorage | Preferensi ringan (tema, onboarding flag) |
| Form | React Hook Form | Form tambah/edit task |
| Validation | Zod | Skema validasi input |
| Notifikasi | expo-notifications | Reminder lokal terjadwal |
| Animasi | react-native-reanimated, react-native-gesture-handler | Swipe, transisi layar, layout animation |
| Drag reorder | react-native-draggable-flatlist | Reorder task manual |
| Tanggal | date-fns | Format & kalkulasi tanggal |
| Haptic | expo-haptics | Feedback getaran saat interaksi |
| Ikon & ilustrasi | @expo/vector-icons, react-native-svg | Icon UI & custom illustration empty state |

---

## 2. Struktur Folder

```
app/
  _layout.tsx                # Root layout, provider, font, theme
  index.tsx                  # Home / daftar task (today view)
  (tabs)/
    _layout.tsx               # Tab navigator
    index.tsx                 # Today
    upcoming.tsx               # Upcoming tasks
    completed.tsx              # Riwayat selesai
    settings.tsx               # Pengaturan
  task/
    [id].tsx                  # Detail / edit task
    new.tsx                    # Tambah task (modal)
  onboarding/
    index.tsx                 # Onboarding flow (first launch)

components/
  task/
    TaskCard.tsx
    TaskList.tsx
    SwipeableRow.tsx
    DraggableTaskList.tsx
  ui/
    Button.tsx
    Input.tsx
    Chip.tsx
    EmptyState.tsx
    BottomSheet.tsx
  animations/
    FadeInView.tsx
    ProgressRing.tsx

lib/
  db/
    schema.ts                 # Drizzle schema / SQLite schema
    client.ts                 # DB init & migration
    queries/
      task.queries.ts
  notifications/
    scheduler.ts               # Jadwalkan & batalkan reminder
    permissions.ts
  validation/
    task.schema.ts             # Zod schema
  utils/
    date.ts
    haptics.ts

store/
  useTaskStore.ts              # Zustand: task state + actions
  useSettingsStore.ts          # Zustand: tema, filter, preferensi

types/
  task.d.ts

constants/
  colors.ts                    # Design tokens (brand colors)
  typography.ts
```

---

## 3. Data Model

### Table: `tasks`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | TEXT (uuid) | Primary key |
| title | TEXT | Judul task |
| notes | TEXT (nullable) | Catatan tambahan |
| due_date | INTEGER (timestamp, nullable) | Tenggat waktu |
| reminder_at | INTEGER (timestamp, nullable) | Waktu reminder terjadwal |
| priority | TEXT | `low` \| `medium` \| `high` |
| is_completed | INTEGER (0/1) | Status selesai |
| completed_at | INTEGER (nullable) | Waktu diselesaikan |
| order_index | INTEGER | Untuk drag-reorder |
| category | TEXT (nullable) | Label/kategori task |
| notification_id | TEXT (nullable) | ID notifikasi expo untuk cancel |
| created_at | INTEGER | Timestamp dibuat |
| updated_at | INTEGER | Timestamp diubah |

### Zod schema (validasi form)
```ts
const taskSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(120),
  notes: z.string().max(500).optional(),
  dueDate: z.date().optional(),
  reminderAt: z.date().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z.string().optional(),
});
```

---

## 4. State Management (Zustand)

`useTaskStore`:
- `tasks: Task[]`
- `fetchTasks()`
- `addTask(input)` → insert DB → jadwalkan notifikasi → update store
- `updateTask(id, input)`
- `toggleComplete(id)` → update DB + cancel/reschedule notif
- `deleteTask(id)` → cancel notif → hapus DB
- `reorderTasks(newOrder)` → update `order_index` batch

`useSettingsStore` (persisted via AsyncStorage):
- `theme: "light" | "dark" | "system"`
- `hasOnboarded: boolean`
- `defaultReminderOffset: number` (mis. 30 menit sebelum due date)

Pola: **DB (SQLite) sebagai source of truth**, Zustand sebagai cache di memori untuk render cepat. Setiap mutasi → tulis ke DB dulu → sync ke store.

---

## 5. Notification Flow (Lokal)

1. User set `dueDate` + `reminderAt` saat membuat/edit task.
2. `scheduler.ts` memanggil `Notifications.scheduleNotificationAsync()` dengan trigger waktu tersebut.
3. `notification_id` hasil scheduling disimpan di row task (untuk bisa dibatalkan).
4. Saat task di-edit (ubah waktu) → cancel notifikasi lama → jadwalkan baru.
5. Saat task selesai/dihapus → cancel notifikasi terkait.
6. Permission diminta di layar onboarding, bukan langsung saat app dibuka pertama kali (supaya tidak terasa memaksa).

> Catatan: ini notifikasi lokal (on-device), tidak butuh server. Kalau ke depan mau multi-device sync, baru perlu backend + Expo Push Notification Service.

---

## 6. Navigation Flow

```
Splash → Onboarding (first launch only) → Permission notifikasi
   ↓
Tab Navigator
 ├─ Today        → daftar task hari ini (default screen)
 ├─ Upcoming     → task mendatang, grouped by tanggal
 ├─ Completed    → riwayat, dengan filter tanggal
 └─ Settings     → tema, default reminder, tentang app

Dari mana saja → Task Detail (modal/sheet) → Edit / Hapus
Floating Action Button → New Task (modal bottom sheet)
```

---

## 7. Prinsip UI/UX — "Tidak Standar"

Supaya tidak terasa seperti to-do app template pada umumnya:

1. **Swipe gesture** — swipe kanan untuk selesai (dengan haptic + animasi checkmark), swipe kiri untuk hapus/reminder ulang. Bukan tombol checkbox biasa.
2. **Drag to reorder** — task bisa disusun ulang manual dengan drag, bukan sekadar sort by date.
3. **Progress ring** — indikator progres harian berbentuk ring animasi (bukan progress bar linear), muncul di header Today.
4. **Custom empty state** — ilustrasi SVG unik tiap kondisi kosong (belum ada task, semua selesai, dsb), bukan teks generik "No tasks".
5. **Micro-interaction** — animasi fade/scale saat task selesai (checklist "bounce"), haptic feedback ringan di setiap aksi utama.
6. **Bottom sheet, bukan modal penuh** — tambah/edit task pakai bottom sheet yang bisa di-drag, terasa lebih ringan daripada pindah halaman penuh.
7. **Kategori dengan warna & bentuk chip custom** — bukan dropdown biasa, tapi chip yang bisa dipilih dengan animasi.

---

## 8. Design Tokens (dari brand color)

```ts
// constants/colors.ts
export const colors = {
  primary: "#005ec3",
  primaryLight: "#1a73e8",
  primaryDark: "#004793",
  background: "#F7F9FC",
  surface: "#FFFFFF",
  textPrimary: "#0F1B2A",
  textSecondary: "#6B7684",
  success: "#1E9E63",
  danger: "#E5484D",
  priorityHigh: "#E5484D",
  priorityMedium: "#F5A623",
  priorityLow: "#1a73e8",
};
```

Tipografi: satu font family (mis. Inter / Plus Jakarta Sans) dengan 2 weight utama (Regular & SemiBold) — hindari terlalu banyak variasi biar tetap terasa premium & rapi.

---

## 9. Milestone Pengembangan (Saran)

| Fase | Scope |
|---|---|
| 1 | Setup project, DB schema, CRUD task dasar (tanpa animasi) |
| 2 | Notifikasi lokal (schedule, cancel, permission flow) |
| 3 | UI/UX: swipe gesture, bottom sheet, drag reorder |
| 4 | Micro-interaction: haptic, progress ring, empty state SVG |
| 5 | Settings, tema (light/dark), polish & testing |

---

## 10. Catatan / Asumsi

- Target platform: Android saja (sesuai permintaan awal), tapi stack ini juga jalan di iOS tanpa perubahan besar kalau nanti diperluas.
- Belum ada kebutuhan backend/akun user — semua data lokal di device.
- Nama aplikasi masih placeholder, sesuaikan `app.json` dan branding saat sudah fix.
