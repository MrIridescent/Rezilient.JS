import React from 'react';

const Sidebar = () => (
  <aside style={{ width: '220px', background: '#222', color: '#fff', height: '100vh', padding: '1rem' }}>
    <h2>Navigation</h2>
    <ul style={{ listStyle: 'none', padding: 0 }}>
      <li>Dashboard</li>
      <li>Users</li>
      <li>Settings</li>
    </ul>
  </aside>
);

export default Sidebar;

