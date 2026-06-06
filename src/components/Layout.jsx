// src/components/Layout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '150px', padding: '20px', backgroundColor: '#f8f9fa' }}>
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;