
import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-csae-green-50 to-white">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
