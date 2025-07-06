import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Register service worker
const updateSW = registerSW({ 
  // Increase the interval to check for updates to reduce reload frequency
  immediate: false,
  intervalMS: 60 * 60 * 1000, // Check for updates every hour instead of every minute
  onNeedRefresh() {
    // Use a less intrusive notification instead of a confirm dialog
    const shouldUpdate = window.localStorage.getItem('autoUpdateEnabled') !== 'false';
    if (shouldUpdate) {
      console.log('New content available, updating automatically');
      updateSW(true);
    } else {
      console.log('New content available, but auto-update is disabled');
      // Could show a toast notification here instead
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

createRoot(document.getElementById("root")!).render(<App />);