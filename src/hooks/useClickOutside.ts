import { useEffect, RefObject } from "react";

/**
 * Custom hook untuk mendeteksi klik atau sentuhan (touch) di luar elemen HTML tertentu.
 * Sangat cocok untuk menutup dropdown, modal, atau floating panel tanpa memicu re-render tak perlu.
 * 
 * @param ref - React RefObject dari elemen container yang ingin diamati
 * @param handler - Fungsi callback yang akan dipanggil saat klik terjadi di luar container
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Jika ref belum ter-mount atau klik terjadi tepat DI DALAM container, abaikan
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}
