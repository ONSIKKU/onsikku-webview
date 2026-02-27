import { useEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import splashAnimation from '@/assets/images/onsikku_splash.json';

type AppSplashProps = {
  onDone: () => void;
};

export default function AppSplash({ onDone }: AppSplashProps) {
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onDone();
  };

  useEffect(() => {
    const timer = window.setTimeout(finish, 2200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-orange-50">
      <div className="w-[220px] h-[220px]">
        <Lottie
          animationData={splashAnimation}
          autoplay
          loop={false}
          onComplete={finish}
        />
      </div>
    </div>
  );
}
