import { createBrowserRouter } from 'react-router-dom';
import RouteErrorBoundary from '../components/RouteErrorBoundary';
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
    element: <ResumeBuilder />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/builder/:id',
    element: <ResumeBuilder />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/ats',
    element: <AtsChecker />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/goals',
    element: <DailyGoals />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/dashboard',
    element: <DailyGoals />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/mock-chamber',
    element: <MockChamberLanding />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/mock-chamber/room',
    element: <MockChamberRoom />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/mock-chamber/report/:id',
    element: <MockChamberReport />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/roadmap',
    element: <RoadmapPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/skills',
    element: <SkillTracker />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/challenge/setup',
    element: <QuickChallengeSetup />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/challenge/:id',
    element: <LiveChallenge />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/challenge/:id/results',
    element: <ChallengeResults />,
    errorElement: <RouteErrorBoundary />,
  },
]);
