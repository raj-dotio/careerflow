import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import ResumeBuilder from '../pages/ResumeBuilder';
import AtsChecker from '../pages/AtsChecker';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/builder',
    element: <ResumeBuilder />,
  },
  {
    path: '/builder/:id',
    element: <ResumeBuilder />,
  },
  {
    path: '/ats',
    element: <AtsChecker />,
  },
]);
