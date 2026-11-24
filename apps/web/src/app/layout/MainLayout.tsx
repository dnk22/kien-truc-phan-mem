import { useState } from 'react';
import { Drawer, Grid, Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { SidebarNavigation } from './SidebarNavigation';
import { AppHeader } from './AppHeader';
export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const screens = Grid.useBreakpoint();
  const desktop = screens.lg;
  return (
    <Layout className="app-layout">
      {desktop ? (
        <Layout.Sider
          width={256}
          collapsedWidth={0}
          collapsed={collapsed}
          className="app-sidebar"
        >
          <SidebarNavigation />
        </Layout.Sider>
      ) : (
        <Drawer
          title="Điều hướng"
          placement="left"
          width={290}
          open={drawer}
          onClose={() => setDrawer(false)}
        >
          <SidebarNavigation onNavigate={() => setDrawer(false)} />
        </Drawer>
      )}
      <Layout className="app-main">
        <AppHeader
          toggle={() => (desktop ? setCollapsed(!collapsed) : setDrawer(true))}
        />
        <Layout.Content className="app-content">
          <Outlet />
        </Layout.Content>
        <footer className="app-footer">
          MiniMart Management · Nhóm 06 PTIT
        </footer>
      </Layout>
    </Layout>
  );
}
