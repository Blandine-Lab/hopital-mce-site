import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {isMobile && (
        <button
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            zIndex: 1001,
            backgroundColor: '#8b0000',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          ☰
        </button>
      )}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />
      <div style={{
        flex: 1,
        marginLeft: (!isMobile || sidebarOpen) ? '150px' : '0',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        transition: 'margin-left 0.3s ease'
      }}>
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;