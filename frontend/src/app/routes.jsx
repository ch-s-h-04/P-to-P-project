import React from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import RoomPage from '../pages/RoomPage.jsx';
import { useSocketLifecycle } from '../hooks/useSocket.js';

function SocketWrapper() {
  useSocketLifecycle();
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <SocketWrapper />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/room/:roomId',
        element: <RoomPage />,
      },
    ],
  },
]);

export default router;
