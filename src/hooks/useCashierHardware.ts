import { useEffect, useRef, useState, useCallback } from 'react';

export function useCashierHardware(orders: any[], selectedOrderId: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<any>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const prevOrdersCount = useRef<number>(0);

  useEffect(() => {
    // initialize audio
    if (!audioRef.current) {
      audioRef.current = new Audio("/audio-loop.mp3");
      audioRef.current.loop = false; // We handle loop manually
    }
    
    // Wake Lock
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && document.visibilityState === 'visible') {
        try {
          if (wakeLockRef.current) {
            wakeLockRef.current.release().catch(() => {});
          }
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (e) {
          console.warn("WakeLock Error", e);
        }
      }
    };
    requestWakeLock();

    const handleVis = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
        document.title = 'Kasir Dashboard';
      }
    };
    document.addEventListener('visibilitychange', handleVis);
    
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        setPermissionGranted(true);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(p => {
          if (p === 'granted') setPermissionGranted(true);
        });
      }
    }

    return () => {
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, []);

  // Handle loop using onended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentOrdersCount = orders.length;
    if (currentOrdersCount > prevOrdersCount.current) {
       setIsMuted(false); // un-mute if new order comes in
    }
    prevOrdersCount.current = currentOrdersCount;

    const needsAttention = orders.some(o => 
      o.order_status === 'WAITING_PAYMENT' || o.order_status === 'WAITING_CONFIRMATION' || o.payment_status === 'WAITING_PAYMENT' || o.payment_status === 'WAITING_CONFIRMATION'
    );

    // If no longer needs attention, reset mute
    if (!needsAttention) {
      setIsMuted(false);
    }

    const handleEnded = () => {
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
      // Wait 10 seconds then play again
      loopTimeoutRef.current = setTimeout(() => {
        audio.currentTime = 0;
        audio.play().catch(() => {
          setIsAudioUnlocked(false);
        });
      }, 10000);
    };

    audio.addEventListener('ended', handleEnded);

    if (needsAttention && !selectedOrderId && !isMuted) {
       // Play if not playing
       if (audio.paused) {
         audio.play().catch(() => {
           setIsAudioUnlocked(false);
         });
       } else {
         setIsAudioUnlocked(true);
       }

       if (document.visibilityState !== 'visible') {
         document.title = '🚨 PESANAN BARU! 🚨';
         if (permissionGranted) {
           new Notification("Pesanan Baru Masuk!", {
             body: "Ada pesanan online baru yang perlu segera diverifikasi.",
             icon: "/images/hero-section-logo.PNG"
           });
         }
       }
    } else {
       audio.pause();
       audio.currentTime = 0;
       if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
       if (document.visibilityState === 'visible') document.title = 'Kasir Dashboard';
    }

    return () => {
       audio.removeEventListener('ended', handleEnded);
    };
  }, [orders, selectedOrderId, permissionGranted, isMuted]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
    setIsMuted(true);
  }, []);

  const unlockAudio = useCallback(() => {
    if (audioRef.current && !isAudioUnlocked) {
      audioRef.current.play().then(() => {
        audioRef.current?.pause();
        audioRef.current!.currentTime = 0;
        setIsAudioUnlocked(true);
      }).catch(() => {});
    }
  }, [isAudioUnlocked]);

  const playAudio = useCallback(() => {
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  return { stopAudio, playAudio, unlockAudio, audioUnlocked: isAudioUnlocked, isMuted, setIsMuted };
}
