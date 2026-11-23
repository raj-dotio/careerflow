import { createBrowserRouter } from 'react-router-dom';
import RouteErrorBoundary from '../components/RouteErrorBoundary';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Home from '../pages/Home';
import ResumeBuilder from '../pages/ResumeBuilder';
import AtsChecker from '../pages/AtsChecker';
import DailyGoals from '../pages/DailyGoals';
import MockChamberLanding from '../pages/MockChamberLanding';
import MockChamberRoom from '../pages/MockChamberRoom';
import MockChamberReport from '../pages/MockChamberReport';
import RoadmapPage from '../pages/RoadmapPage';
import SkillTracker from '../pages/SkillTracker';
import QuickChallengeSetup from '../pages/QuickChallengeSetup';
import LiveChallenge from '../pages/LiveChallenge';
import ChallengeResults from '../pages/ChallengeResults';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/builder',
    element: (
      <ProtectedRoute>
        <ResumeBuilder />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/builder/:id',
    element: (
      <ProtectedRoute>
        <ResumeBuilder />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/ats',
    element: (
      <ProtectedRoute>
        <AtsChecker />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/goals',
    element: (
      <ProtectedRoute>
        <DailyGoals />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DailyGoals />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/mock-chamber',
    element: (
      <ProtectedRoute>
        <MockChamberLanding />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/mock-chamber/room',
    element: (
      <ProtectedRoute>
        <MockChamberRoom />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/mock-chamber/report/:id',
    element: (
      <ProtectedRoute>
        <MockChamberReport />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/roadmap',
    element: (
      <ProtectedRoute>
        <RoadmapPage />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/skills',
    element: (
      <ProtectedRoute>
        <SkillTracker />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/challenge/setup',
    element: (
      <ProtectedRoute>
        <QuickChallengeSetup />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/challenge/:id',
    element: (
      <ProtectedRoute>
        <LiveChallenge />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/challenge/:id/results',
    element: (
      <ProtectedRoute>
        <ChallengeResults />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
]);
