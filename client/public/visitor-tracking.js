/**
 * Visitor Tracking Script for Static HTML Pages
 * Connects to the Railway server via Socket.IO to register visitors
 * and track page navigation in the admin panel.
 */
(function() {
  'use strict';

  const SOCKET_URL = 'https://amwaaj-production.up.railway.app';
  
  // Load Socket.IO client library dynamically
  function loadSocketIO(callback) {
    if (window.io) {
      callback();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.6.0/socket.io.min.js';
    script.onload = callback;
    script.onerror = function() {
      console.error('[Tracking] Failed to load Socket.IO');
    };
    document.head.appendChild(script);
  }

  // Get current page name from URL
  function getPageName() {
    const path = window.location.pathname;
    if (path === '/' || path === '/amouage-home.html') return 'الصفحة الرئيسية';
    if (path.includes('products--')) {
      const name = path.replace('/products--', '').replace('.html', '').replace(/-/g, ' ');
      return 'منتج: ' + name;
    }
    if (path.includes('collections')) return 'المجموعات';
    if (path.includes('cart')) return 'السلة';
    if (path.includes('pages--')) {
      const name = path.replace('/pages--', '').replace('.html', '').replace(/-/g, ' ');
      return 'صفحة: ' + name;
    }
    return path;
  }

  // Initialize tracking
  function initTracking() {
    loadSocketIO(function() {
      try {
        const socket = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000
        });

        socket.on('connect', function() {
          console.log('[Tracking] Connected to server');
          // Register visitor
          const existingVisitorId = localStorage.getItem('visitorId');
          socket.emit('visitor:register', { existingVisitorId: existingVisitorId });
        });

        socket.on('successfully-connected', function(data) {
          console.log('[Tracking] Visitor registered:', data);
          // Save visitor ID for reconnection
          if (data.pid) {
            localStorage.setItem('visitorId', data.pid);
          }
          // Send current page
          const pageName = getPageName();
          socket.emit('visitor:pageEnter', pageName);
        });

        socket.on('connect_error', function(error) {
          console.error('[Tracking] Connection error:', error.message);
        });

        socket.on('visitor:navigate', function(page) {
          if (page) {
            window.location.href = '/' + page;
          }
        });

        socket.on('blocked', function() {
          console.log('[Tracking] Visitor blocked');
        });

        socket.on('deleted', function() {
          localStorage.removeItem('visitorId');
          window.location.href = '/';
        });

        // Track page visibility changes
        document.addEventListener('visibilitychange', function() {
          if (document.visibilityState === 'visible' && socket.connected) {
            socket.emit('visitor:pageEnter', getPageName());
          }
        });

        // Note: We do NOT disconnect on beforeunload anymore.
        // Socket.IO will detect the connection drop automatically.
        // This prevents duplicate visitor cards when navigating between pages.

      } catch (e) {
        console.error('[Tracking] Error initializing:', e);
      }
    });
  }

  // Start tracking when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }
})();
