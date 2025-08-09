import React from 'react';
import { useAetherStore, useCarbonAware, useOfflineFirst, useSelfHealing } from 'rezilient.js';
import { CssBaseline, AppBar, Toolbar, Typography, Container, Button, Box, Paper } from '@mui/material';

function ErrorBoundary({ children }) {
  const { error, retry } = useSelfHealing();
  if (error) {
    return (
      <Paper sx={{ p: 3, bgcolor: '#ffeaea' }}>
        <Typography color="error" variant="h6">Self-Healing Error Detected</Typography>
        <Typography variant="body2">{error.message}</Typography>
        <Button onClick={retry} variant="contained" color="primary">Retry</Button>
      </Paper>
    );
  }
  return children;
}

export default function App() {
  const [store, updateStore] = useAetherStore({ count: 0 });
  const { carbonIntensity, isLowCarbon } = useCarbonAware();
  const { isOnline, syncStatus } = useOfflineFirst();

  return (
    <React.Fragment>
      <CssBaseline />
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            REZILIENT.js Admin Dashboard
          </Typography>
          <Button color="inherit" href="https://github.com/Rezilient.js" aria-label="GitHub Community">@Rezilient.js</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <ErrorBoundary>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>Resilient Status</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Paper sx={{ p: 2, flex: 1 }} aria-label="Carbon Status">
                <Typography variant="subtitle1">Carbon Status</Typography>
                <Typography color={isLowCarbon ? 'success.main' : 'warning.main'}>
                  {isLowCarbon ? '🟢 Low Impact' : '🟡 Medium Impact'}
                </Typography>
                <Typography variant="caption">Intensity: {carbonIntensity?.toFixed(2) || 'N/A'}</Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1 }} aria-label="Connection Status">
                <Typography variant="subtitle1">Connection</Typography>
                <Typography color={isOnline ? 'success.main' : 'error.main'}>
                  {isOnline ? '🟢 Online' : '🔴 Offline'}
                </Typography>
                <Typography variant="caption">Sync: {syncStatus || 'Ready'}</Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1 }} aria-label="Counter">
                <Typography variant="subtitle1">Counter</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button aria-label="Decrease" onClick={() => updateStore(s => ({ ...s, count: s.count - 1 }))}>-</Button>
                  <Typography variant="h6">{store.count}</Typography>
                  <Button aria-label="Increase" onClick={() => updateStore(s => ({ ...s, count: s.count + 1 }))}>+</Button>
                </Box>
              </Paper>
            </Box>
          </Box>
          <Box>
            <Typography variant="h5" gutterBottom>Admin Data</Typography>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2">This dashboard is offline-first, carbon-aware, accessibility-first, and self-healing. Try disconnecting your network or simulating errors to see resilience in action!</Typography>
            </Paper>
          </Box>
        </ErrorBoundary>
      </Container>
    </React.Fragment>
  );
}

