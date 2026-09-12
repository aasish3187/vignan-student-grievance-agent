// =====================================================================
// Authority Authentication Gateway Script — Agent 46
// Production-Grade Officer Login (HoDs, Deans & Committee Chairs)
// Vignan University — Agentic AI Day 2026
// Strict Professional Standard — Zero Emojis, 100% Vector Geometry
// =====================================================================

(function() {
  'use strict';

  // DOM Elements
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const togglePwBtn = document.getElementById('togglePw');
  const loginAlert = document.getElementById('loginAlert');
  const alertIcon = document.getElementById('alertIcon');
  const alertMessage = document.getElementById('alertMessage');
  const toggleGuideBtn = document.getElementById('toggleGuide');
  const guideBody = document.getElementById('guideBody');
  const loginForm = document.getElementById('loginForm');

  // Toggle Password Visibility
  if (togglePwBtn && passwordInput) {
    togglePwBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePwBtn.innerHTML = isPassword
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="23" x2="23" y2="23"></line></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    });
  }

  // Toggle Credentials Guide Accordion
  if (toggleGuideBtn && guideBody) {
    toggleGuideBtn.addEventListener('click', () => {
      const isExpanded = toggleGuideBtn.getAttribute('aria-expanded') === 'true';
      toggleGuideBtn.setAttribute('aria-expanded', !isExpanded);
      guideBody.style.display = isExpanded ? 'none' : 'block';
    });
  }

  // Alert Helpers
  function showAlert(type, htmlContent) {
    if (!loginAlert) return;
    loginAlert.className = `login-alert alert-${type}`;
    loginAlert.style.display = 'flex';

    if (type === 'error') {
      alertIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
      alertIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    }

    alertMessage.innerHTML = htmlContent;
  }

  function hideAlert() {
    if (loginAlert) loginAlert.style.display = 'none';
  }

  // Form Submit Handler
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      if (!username) {
        showAlert('error', 'Please enter your institutional officer ID or username.');
        usernameInput.focus();
        return;
      }

      performLogin(username, password);
    });
  }

  // API Call
  async function performLogin(username, password) {
    hideAlert();
    setLoadingState(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          const cleanMsg = (result.message || '').replace(/^Access Denied:\s*/i, '');
          showAlert('error', `<strong>Access Denied:</strong> ${cleanMsg || 'Credentials cannot be validated for administrative clearance.'}`);
        } else {
          showAlert('error', result.message || 'Authentication failed. Please verify officer credentials.');
        }
        setLoadingState(false);
        return;
      }

      const user = result.data.user;
      const token = result.data.token;

      // Store authority session
      localStorage.setItem('agent46_user', JSON.stringify(user));
      localStorage.setItem('agent46_token', token);

      showAlert('success', `Authenticated as <strong>${user.title || user.name}</strong>. Loading administrative console...`);

      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get('redirect');

      setTimeout(() => {
        window.location.href = redirectParam || 'admin.html';
      }, 500);

    } catch (err) {
      console.error('Login network failure', err);
      showAlert('error', 'Unable to reach authentication server. Please check connection.');
      setLoadingState(false);
    }
  }

  function setLoadingState(loading) {
    if (!loginBtn) return;
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');

    if (loading) {
      loginBtn.disabled = true;
      if (btnText) btnText.style.display = 'none';
      if (btnLoading) btnLoading.style.display = 'inline-block';
    } else {
      loginBtn.disabled = false;
      if (btnText) btnText.style.display = 'inline-block';
      if (btnLoading) btnLoading.style.display = 'none';
    }
  }

})();
