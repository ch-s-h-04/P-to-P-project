import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import RoomPage from '../pages/RoomPage.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/room/:roomId',
    element: <RoomPage />,
  },
]);

export default router;
