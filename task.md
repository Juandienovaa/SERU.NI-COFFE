# Enterprise Workspace Navigation Redesign Tracker

- `[x]` **Phase 1: Component Architecture Setup**
  - `[x]` Buat `ManagerProfileHeader.tsx`
  - `[x]` Buat `NavigationItem.tsx`
  - `[x]` Buat `LogoutSection.tsx` dan `LogoutDialog.tsx`
  - `[x]` Buat `OverlayFooter.tsx`

- `[x]` **Phase 2: Core Overlay & Motion Integration**
  - `[x]` Refactor `ManagerNavigationOverlay.tsx` menggunakan komponen-komponen baru.
  - `[x]` Integrasi animasi Framer Motion (Stagger, Hover, Glow, Scale).
  - `[x]` Terapkan efek *Glassmorphism* dan *Radial Gradient*.
  - `[x]` Pindahkan tombol Close ke dalam Top Navigation dengan rotasi *hover*.

- `[x]` **Phase 3: Logout Logic & Clean Up**
  - `[x]` Hubungkan `LogoutDialog.tsx` dengan fungsi `supabase.auth.signOut()`.
  - `[x]` Bersihkan `localStorage` dan redirect ke `/auth-pin` atau halaman login.
  - `[x]` Uji coba aksesibilitas (ESC Key, Focus Trap).
