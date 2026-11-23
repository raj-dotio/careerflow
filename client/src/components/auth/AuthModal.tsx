import { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../utils/firebase';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { setUser, closeAuthModal, setError } from '../../redux/userSlice';

export default function AuthModal() {
  const dispatch = useAppDispatch();
  const { isAuthModalOpen, error } = useAppSelector((state) => state.user);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        dispatch(closeAuthModal());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, dispatch]);

  if (!isAuthModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    dispatch(setError(null));

    try {
      // 1. Authenticate with Firebase Google Auth
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      if (!fbUser.email) {
        throw new Error('No email found associated with this Google Account');
      }

      // 2. Synchronize with CareerFlow backend to obtain session & Mongo record
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: fbUser.displayName || 'Student',
          email: fbUser.email,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server authentication failed (Status ${res.status})`);
      }

      const dbUser = await res.json();

      // 3. Save to Redux & LocalStorage
      dispatch(
        setUser({
          uid: fbUser.uid,
          _id: dbUser._id,
          name: dbUser.name || fbUser.displayName || 'Student',
          displayName: fbUser.displayName || dbUser.name || 'Student',
          email: fbUser.email,
          photoURL: fbUser.photoURL || null,
          avatarIcon: 'graduate',
          role: dbUser.role || 'student',
          credits: dbUser.credits ?? 1000,
          streakCount: dbUser.streakCount ?? 0,
        })
      );
    } catch (err: unknown) {
      console.error('Sign-in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';

      // Provide helpful guidance if Firebase API keys are unconfigured in client/.env
      if (
        errorMessage.includes('api-key-not-found') ||
        errorMessage.includes('invalid-api-key') ||
        errorMessage.includes('auth/configuration-not-found')
      ) {
        setLocalError(
          'Firebase API keys are not yet configured in client/.env. You can sign in using Demo mode or your email below!'
        );
        setShowManualLogin(true);
      } else if (errorMessage.includes('popup-closed-by-user')) {
        setLocalError('Sign-in window closed. Please try again.');
      } else {
        setLocalError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectSignIn = async (name: string, email: string) => {
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim() || 'Student Pioneer',
          email: email.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Authentication failed');
      }

      const dbUser = await res.json();

      dispatch(
        setUser({
          _id: dbUser._id,
          name: dbUser.name,
          displayName: dbUser.name,
          email: dbUser.email,
          photoURL: null,
          avatarIcon: 'graduate',
          role: dbUser.role || 'student',
          credits: dbUser.credits ?? 1000,
          streakCount: dbUser.streakCount ?? 0,
        })
      );
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Direct sign-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      {/* Background click to close */}
      <div
        className="fixed inset-0 -z-10"
        onClick={() => dispatch(closeAuthModal())}
        aria-hidden="true"
      />

      <div className="sketch-card bg-[#faf8f5] border-3 border-[#18181b] p-6 sm:p-8 max-w-[440px] w-full relative shadow-[8px_8px_0px_#18181b] animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={() => dispatch(closeAuthModal())}
          className="absolute top-4 right-4 p-1.5 rounded-lg border-2 border-[#18181b] hover:bg-rose-50 text-[#18181b] hover:text-[#e11d48] transition-all cursor-pointer"
          aria-label="Close auth dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fff1f2] border-2 border-[#e11d48] rounded-full text-[11px] font-black tracking-wide text-[#e11d48] uppercase mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Access Restricted</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-[26px] font-black text-[#141416] tracking-tight leading-tight">
          Sign In to Unlock CareerFlow
        </h2>

        <p className="mt-2 text-sm text-[#4b5563] font-medium leading-relaxed">
          Log in with your Google account to access your personal AI Mock Chamber, ATS Diagnostics,
          Daily Goals streak matrix, and learning roadmaps.
        </p>

        {/* Feature Highlights */}
        <div className="my-5 p-3.5 bg-white border-2 border-[#18181b] rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#27272a]">
            <CheckCircle2 className="w-4 h-4 text-[#e11d48] shrink-0" />
            <span>1,000 Free AI Credits immediately credited</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#27272a]">
            <CheckCircle2 className="w-4 h-4 text-[#e11d48] shrink-0" />
            <span>Sync daily targets, streaks &amp; GitHub-style heatmaps</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#27272a]">
            <CheckCircle2 className="w-4 h-4 text-[#e11d48] shrink-0" />
            <span>Interactive Real-Time AI Mock Interviews</span>
          </div>
        </div>

        {/* Error notification if any */}
        {(localError || error) && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-500 rounded-lg text-xs font-semibold text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span className="leading-snug">{localError || error}</span>
          </div>
        )}

        {/* Primary Action: Firebase Google Login Button */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border-2 border-[#18181b] rounded-lg shadow-[3px_3px_0px_#18181b] hover:shadow-[1px_1px_0px_#18181b] hover:translate-x-[2px] hover:translate-y-[2px] font-bold text-[#18181b] text-sm flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#e11d48]" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Quick Demo Mode option */}
          <button
            onClick={() => handleDirectSignIn('Demo Student', 'student@careerflow.dev')}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-[#fff1f2] hover:bg-[#ffe4e6] border-2 border-[#e11d48] rounded-lg text-xs font-bold text-[#e11d48] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>One-Click Demo Student Sign In</span>
          </button>
        </div>

        {/* Toggle Manual Email Form (Fallback) */}
        <div className="mt-4 pt-3 border-t border-dashed border-[#d4d4d8] text-center">
          {!showManualLogin ? (
            <button
              onClick={() => setShowManualLogin(true)}
              className="text-[12px] font-semibold text-[#71717a] hover:text-[#18181b] underline underline-offset-2 transition-colors cursor-pointer"
            >
              Sign in with custom name &amp; email
            </button>
          ) : (
            <div className="space-y-2.5 mt-2 text-left animate-in fade-in">
              <div>
                <label className="block text-[11px] font-bold text-[#52525b] uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Piyush Sharma"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border-2 border-[#18181b] rounded focus:outline-none focus:ring-1 focus:ring-[#e11d48]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#52525b] uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border-2 border-[#18181b] rounded focus:outline-none focus:ring-1 focus:ring-[#e11d48]"
                />
              </div>
              <button
                onClick={() => handleDirectSignIn(manualName, manualEmail)}
                disabled={isSubmitting || !manualEmail.trim()}
                className="w-full py-2 bg-[#18181b] hover:bg-[#27272a] text-white rounded font-bold text-xs cursor-pointer transition-colors disabled:opacity-50"
              >
                Sign In With Email
              </button>
            </div>
          )}
        </div>

        <p className="mt-4 text-[11px] text-center text-[#a1a1aa] font-medium">
          By signing in, you agree to CareerFlow&apos;s campus terms of service and honor code.
        </p>
      </div>
    </div>
  );
}
