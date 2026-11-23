import { type ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowLeft, LogIn } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { openAuthModal } from '../../redux/userSlice';
import AuthModal from './AuthModal';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.user);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      dispatch(openAuthModal());
    }
  }, [isAuthenticated, user, dispatch]);

  if (isAuthenticated && user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-4">
      <AuthModal />
      <div className="sketch-card bg-white max-w-md w-full p-8 text-center space-y-5 border-3 border-[#18181b] shadow-[6px_6px_0px_#18181b]">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#fff1f2] border-2 border-[#e11d48] flex items-center justify-center text-[#e11d48]">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-[#141416]">Sign In Required</h2>
          <p className="mt-2 text-sm text-[#52525b]">
            Please sign in with your student account to access this feature and save your progress.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => dispatch(openAuthModal())}
            className="sketch-btn-red py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Open Sign In Dialog</span>
          </button>

          <Link
            to="/"
            className="sketch-btn-white py-2.5 px-4 text-xs font-bold text-[#71717a] hover:text-[#18181b] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
