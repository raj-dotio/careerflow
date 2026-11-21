import { useRouteError, Link } from 'react-router-dom';

export default function RouteErrorBoundary() {
  const error = useRouteError() as { message?: string };
  console.error('Route error:', error);

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border-2 border-[#18181b] shadow-xl space-y-4">
        <h2 className="text-2xl font-black text-[#18181b]">Something went wrong</h2>
        <p className="text-sm text-[#6b7280]">
          {error?.message || 'An unexpected error occurred while loading this page.'}
        </p>
        <div className="pt-2">
          <Link
            to="/"
            onClick={() => {
              window.location.href = '/';
            }}
            className="inline-block px-5 py-2.5 bg-[#e11d48] text-white font-bold rounded-xl shadow-md hover:bg-[#be123c] transition-all text-sm"
          >
            Reload Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
