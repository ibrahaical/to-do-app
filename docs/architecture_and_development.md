# Trido (to-do, done right) - Architecture & Development Docs

Dokumen ini berisi rangkuman arsitektur, teknologi yang digunakan, serta catatan penting dari proses pengembangan (terutama *gotchas* atau masalah saat *setup* awal) agar tidak perlu mengulangi *debugging* yang menghabiskan banyak token dan waktu di sesi pengembangan masa depan.

---

## 1. Tech Stack & Arsitektur Utama

Aplikasi ini dibangun menggunakan arsitektur modern untuk ekosistem React Native / Expo:

- **Framework**: Expo (React Native) dengan arsitektur **Expo Router** (App Router berbasis struktur folder `app/`).
- **Styling**: NativeWind (Tailwind CSS untuk React Native) untuk *styling* berbasis kelas (utility-first).
- **State Management**: Zustand. Sangat ringan, tidak butuh boilerplate seperti Redux. Digunakan untuk `useTaskStore`, `useCategoryStore`, dan `useSettingsStore` (yang didukung oleh `zustand/middleware` persist ke `AsyncStorage`).
- **Database (Lokal)**: `expo-sqlite` dipadukan dengan **Drizzle ORM** (`drizzle-orm/expo-sqlite`). Drizzle dipilih karena *type-safe* dan selaras dengan ekosistem TypeScript.
- **Animasi & Gestur**: `react-native-reanimated` dan `react-native-gesture-handler` (untuk *SwipeableRow*, *ProgressRing*, dan *DraggableTaskList*).
- **Notifikasi**: `expo-notifications` untuk menjadwalkan *reminder* tugas.

---

## 2. Setup Instalasi & Perintah Terminal

Berikut adalah rekam jejak instalasi (*dependencies*) yang dilakukan lewat terminal dari awal hingga aplikasi bisa berjalan dengan tumpukan teknologi di atas:

### A. Inisiasi Proyek & Navigasi
```bash
# Membuat proyek Expo baru
npx create-expo-app@latest my-app
cd my-app
```
*(Catatan: `create-expo-app` versi terbaru otomatis menyertakan Expo Router)*

### B. Setup Database (Drizzle ORM & Expo SQLite)
Ini merupakan bagian krusial. Kita menggunakan *driver* `expo-sqlite` dengan `drizzle-orm`.
```bash
# Menginstal Expo SQLite
npx expo install expo-sqlite

# Menginstal Drizzle ORM dan utilitas migrasinya
npm install drizzle-orm
npm install -D drizzle-kit

# Babel Plugin opsional jika menggunakan inline babel (untuk drizzle)
npm install -D babel-plugin-inline-import
```

### C. State Management & Penyimpanan Lokal
```bash
npm install zustand @react-native-async-storage/async-storage
```

### D. Animasi & Gestur Usap (Swipe)
Kita menggunakan pustaka reanimated terbaru untuk *swipe gesture*.
```bash
npx expo install react-native-reanimated react-native-gesture-handler expo-haptics
```
**Perhatian di `babel.config.js`:**
Setiap kali menginstal reanimated, pastikan plugin babel ditambahkan:
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin' // Harus selalu diletakkan paling bawah
    ],
  };
};
```

### E. Format Waktu & UI Tambahan
```bash
npm install date-fns
npx expo install @react-native-community/datetimepicker
npx expo install expo-notifications
```

### F. Menjalankan Server
```bash
npx expo start -c
```
*(Flag `-c` sangat dianjurkan setelah instalasi dependency baru, terutama Reanimated/Tailwind, untuk membersihkan cache Metro bundler yang sering tersendat).*

---

## 2. Struktur Database & Drizzle ORM

Skema database disimpan di `lib/db/schema.ts`.
Kita memiliki dua tabel utama:
1. `categories`: Menyimpan data kategori (Personal, Work, Shopping).
2. `tasks`: Menyimpan daftar tugas, berelasi dengan `categoryId`.

### ⚠️ Catatan Penting Setup Drizzle & SQLite (Histori Error)
Pada fase awal pengembangan, kita banyak membuang token dan waktu karena error seputar SQLite dan Drizzle. Berikut adalah pelajaran penting agar tidak terulang:

1. **Sinkronisasi Tabel (Error: `no such table: categories`)**
   - **Masalah:** Drizzle membutuhkan mekanisme untuk menjalankan file migrasi (`.sql`), namun pada *environment* React Native/Expo, eksekusi file migrasi bawaan Drizzle sering kali gagal, tersendat, atau mengalami error *rejected promise* (`NativeDatabase.prepareSync`).
   - **Solusi Final:** Kita melakukan **Migrasi Manual / Sinkronisasi Eksplisit** di dalam `lib/db/client.ts`. Fungsi `runMigrations()` menggunakan `expoDb.execSync(...)` untuk membuat tabel secara mentah menggunakan kueri `CREATE TABLE IF NOT EXISTS`.
   - **Aturan Main:** Jika ada penambahan kolom atau tabel baru di `schema.ts`, **JANGAN LUPA** menambahkannya juga secara manual ke dalam fungsi `runMigrations()` di `client.ts` menggunakan query `ALTER TABLE` atau `CREATE TABLE`.

2. **Pengurutan & Index (Reorder Tasks)**
   - Saat melakukan *drag-and-drop*, kita menggunakan *property* `orderIndex` di database.
   - **Bug sebelumnya:** Terjadi kerusakan urutan karena kita memetakan ulang indeks (0, 1, 2) berdasarkan array yang *terfilter* (misalnya hanya melihat kategori A).
   - **Solusi:** Di `useTaskStore.ts`, fungsi `reorderTasks` sekarang secara cerdas mencocokkan indeks array visual dengan tugas aslinya tanpa merusak urutan tugas lain yang sedang disembunyikan (terfilter).

---

## 3. Direktori Proyek

```text
app/
 ├── (tabs)/           # Layout utama (Tab Navigation)
 │    ├── index.tsx    # Halaman "Today" (Draggable List & Progress Ring)
 │    ├── upcoming.tsx # Halaman "Upcoming" (SectionList by date)
 │    ├── completed.tsx# Halaman "Completed" (Riwayat tugas)
 │    └── settings.tsx # Halaman Pengaturan (Izin notif, Reset, Profil)
 ├── task/
 │    ├── new.tsx      # Form pembuatan tugas baru
 │    └── [id].tsx     # Halaman detail / edit tugas
 ├── search.tsx        # Fitur pencarian global
 ├── onboarding.tsx    # Layar perkenalan perdana
 └── _layout.tsx       # Root layout, inisialisasi DB, pengaturan notifikasi
components/
 ├── animations/       # Komponen visual (ProgressRing.tsx)
 ├── task/             # Komponen spesifik tugas (TaskCard, SwipeableRow, DraggableTaskList)
 └── ui/               # Komponen generik (EmptyState)
lib/
 ├── db/
 │    ├── client.ts    # Inisialisasi expo-sqlite dan runMigrations()
 │    ├── schema.ts    # Definisi tabel Drizzle
 │    └── queries/     # Fungsi abstraksi CRUD (task.queries.ts, category.queries.ts)
 └── notifications/    # Handler izin notifikasi
store/                 # Zustand state managers
types/                 # Definisi Tipe TypeScript (.d.ts)
```

---

## 4. Alur Kerja (Workflow)

- **Optimistic UI:** Setiap aksi (Add, Update, Delete, Toggle Complete) dilakukan secara *optimistic* di memori (Zustand) terlebih dahulu (menggunakan `set(...)`) agar UI merespons secara instan. Setelahnya, baru kueri database dijalankan di belakang layar (`TaskQueries.updateTask(...)`).
- **Pendekatan Kategori:** Kategori bersifat statis secara arsitektur dasar, namun di-seeding otomatis (`seedCategories` di `useCategoryStore.ts`) ke SQLite jika tabel kosong.
- **Lokalisasi:** Antarmuka secara penuh (100%) menggunakan **Bahasa Inggris** (di-hardcode di UI), dengan format tanggal `en-US` via `date-fns`.

---

## 5. Fitur Penting

1. **Gestur Usap (Swipe-to-Action)**: Dibuat dari nol (tanpa library usang) menggunakan `ReanimatedSwipeable` (dari Reanimated & Gesture Handler v2). Usap ke kiri untuk Hapus, ke kanan untuk Tandai Selesai.
2. **Hitung Mundur / Progres (Hero Section)**: Menggunakan komponen SVG kustom `ProgressRing` dengan transisi warna mulus (Biru -> Hijau) saat persentase mencapai 100%.
3. **Pencarian Terpadu**: Halaman terpisah (`app/search.tsx`) dengan filter in-memory.
4. **Keamanan Data (Danger Zone)**: Penghapusan total (Reset Data) dilakukan secara menyeluruh mencakup penghapusan SQLite, pembersihan `AsyncStorage`, dan pembatalan notifikasi yang terjadwal.

---
*Dokumen ini dibuat agar AI asisten dan developer dapat dengan cepat memahami konteks, terhindar dari lubang (pitfalls) migrasi Drizzle+Expo SQLite, dan menjaga konsistensi gaya arsitektur yang sudah terbangun kokoh.*
