// =====================================================================
// Admin Analytics Dashboard Logic — Agent 46
// Real-time KPIs, Systemic Alerts, Chart.js Visualizations,
// Dept x Category Heatmap, Escalation Log, Case Register Table.
// Vignan University — Agentic AI Day 2026
// =====================================================================

const API_BASE = '/api';

// Chart instance holders
let categoryChart = null;
let deptChart = null;
let slaChart = null;
let satisfactionChart = null;

// Palette matching Theme.jpeg & admin.css
const PALETTE = {
  navy: '#1a3c7d',
  navyDark: '#0e2a5c',
  navyLight: '#e8eef8',
  red: '#d62828',
  redLight: '#fde8e8',
  green: '#0f9d58',
  greenLight: '#e6f4ea',
  orange: '#f4a236',
  orangeLight: '#fef3e0',
  purple: '#7c3aed',
  teal: '#0891b2',
  blue: '#4285f4',
  gray: '#6b7280'
};

const CHART_COLORS = [
  '#1a3c7d', '#d62828', '#f4a236', '#0f9d58', '#0891b2',
  '#7c3aed', '#4285f4', '#ec4899', '#8b5cf6', '#10b981'
];

// =====================================================================
// AUTHENTICATION GUARD — Restricted to Institutional Authorities
// =====================================================================
let currentAuthority = null;
try {
  const userStr = localStorage.getItem('agent46_user');
  if (!userStr) {
    window.location.replace('/login.html?redirect=admin.html');
  } else {
    currentAuthority = JSON.parse(userStr);
    if (!currentAuthority || !currentAuthority.role || currentAuthority.role === 'STUDENT') {
      localStorage.removeItem('agent46_user');
      localStorage.removeItem('agent46_token');
      window.location.replace('/login.html?redirect=admin.html');
    }
  }
} catch (e) {
  window.location.replace('/login.html?redirect=admin.html');
}

let pendingRedirectUrl = null;

function confirmSwitchToPortal() {
  openLogoutModal({
    targetUrl: '/',
    title: 'Switch to Student Portal?',
    desc: 'You are currently signed in with an active Institutional Authority session. Switching to the public student portal will securely log you out of your administrative console to prevent unauthorized access.',
    confirmText: 'Log Out & Proceed'
  });
}
window.confirmSwitchToPortal = confirmSwitchToPortal;

function handleLogout() {
  openLogoutModal({
    targetUrl: '/login.html',
    title: 'Confirm Authority Sign-Out',
    desc: 'Are you sure you want to end your active administrative session and return to the Institutional Sign-In gateway?',
    confirmText: 'Confirm Sign-Out'
  });
}
window.handleLogout = handleLogout;

function openLogoutModal(config = {}) {
  pendingRedirectUrl = config.targetUrl || '/';
  const modal = document.getElementById('logoutConfirmModal');
  const titleEl = document.getElementById('logoutModalTitle');
  const descEl = document.getElementById('logoutModalDesc');
  const confirmTextEl = document.getElementById('modalConfirmText');
  const officerTitleEl = document.getElementById('modalOfficerTitle');
  const officerBadgeEl = document.getElementById('modalOfficerBadge');

  if (titleEl && config.title) titleEl.textContent = config.title;
  if (descEl && config.desc) descEl.textContent = config.desc;
  if (confirmTextEl && config.confirmText) confirmTextEl.textContent = config.confirmText;

  if (currentAuthority) {
    if (officerTitleEl) officerTitleEl.textContent = currentAuthority.title || 'Institutional Authority';
    if (officerBadgeEl) officerBadgeEl.textContent = currentAuthority.badge || currentAuthority.role || 'ACTIVE SESSION';
  }

  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}
window.openLogoutModal = openLogoutModal;

function closeLogoutModal() {
  const modal = document.getElementById('logoutConfirmModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
  pendingRedirectUrl = null;
}
window.closeLogoutModal = closeLogoutModal;

function executeLogoutAndRedirect() {
  const destination = pendingRedirectUrl || '/';
  localStorage.removeItem('agent46_user');
  localStorage.removeItem('agent46_token');
  closeLogoutModal();
  window.location.href = destination;
}
window.executeLogoutAndRedirect = executeLogoutAndRedirect;

// Keyboard shortcut to dismiss modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLogoutModal();
    closeCaseDossier();
  }
});

function getAuthHeaders(extra = {}) {
  const headers = { ...extra };
  if (currentAuthority) {
    headers['x-user-id'] = currentAuthority.id;
    headers['x-user-role'] = currentAuthority.role;
  }
  const token = localStorage.getItem('agent46_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function renderAuthorityHeader() {
  if (!currentAuthority) return;
  const titleEl = document.getElementById('authTitle');
  const roleTagEl = document.getElementById('authRoleTag');
  if (titleEl) titleEl.textContent = currentAuthority.title || 'Institutional Authority';
  if (roleTagEl) {
    roleTagEl.textContent = currentAuthority.badge || currentAuthority.role || 'OFFICER';
  }
}

function renderScopeBar(totalCount = null) {
  if (!currentAuthority) return;

  const mandateEl = document.getElementById('scopeMandateTitle');
  const tagEl = document.getElementById('scopeTypeTag');
  const descEl = document.getElementById('scopeDesc');
  const countEl = document.getElementById('scopeCaseCount');

  if (mandateEl) mandateEl.textContent = currentAuthority.title || 'Central Grievance Administrator';

  if (tagEl) {
    if (currentAuthority.committee) {
      tagEl.textContent = 'STATUTORY JURISDICTION';
      tagEl.style.background = '#fef2f2';
      tagEl.style.color = '#b91c1c';
      tagEl.style.borderColor = '#fecaca';
    } else if (currentAuthority.role === 'HOD') {
      tagEl.textContent = 'DEPARTMENTAL JURISDICTION';
      tagEl.style.background = '#eff6ff';
      tagEl.style.color = '#1d4ed8';
      tagEl.style.borderColor = '#bfdbfe';
    } else if (currentAuthority.role === 'ADMIN') {
      tagEl.textContent = 'INSTITUTIONAL OVERVIEW';
      tagEl.style.background = '#f0fdf4';
      tagEl.style.color = '#15803d';
      tagEl.style.borderColor = '#bbf7d0';
    } else {
      tagEl.textContent = 'EXECUTIVE JURISDICTION';
      tagEl.style.background = '#fefce8';
      tagEl.style.color = '#a16207';
      tagEl.style.borderColor = '#fef08a';
    }
  }

  if (descEl) {
    descEl.textContent = currentAuthority.scopeDescription || 'Displaying cases filtered strictly according to institutional jurisdiction mandate.';
  }

  if (countEl && totalCount !== null) {
    countEl.textContent = totalCount;
  }
}

// ---------------------------------------------------------------
// Initialize on page load
// ---------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  renderAuthorityHeader();
  renderScopeBar();
  loadDashboard();
  pollInstitutionalNotifications();
  // Auto-refresh dashboard every 60 seconds
  setInterval(loadDashboard, 60000);
  // Auto-poll notifications every 4 seconds for real-time rating alerts
  setInterval(pollInstitutionalNotifications, 4000);
});

async function loadDashboard() {
  renderAuthorityHeader();
  renderScopeBar();
  await Promise.all([
    fetchKPIs(),
    fetchPatterns(),
    fetchSLACompliance(),
    fetchSatisfaction(),
    fetchHeatmap(),
    fetchEscalationLog(),
    fetchCaseRegister()
  ]);
}

// ---------------------------------------------------------------
// 1. KPI Cards
// ---------------------------------------------------------------
async function fetchKPIs() {
  try {
    const res = await fetch(`${API_BASE}/analytics/dashboard`, { headers: getAuthHeaders() });
    const json = await res.json();
    if (!json.success || !json.data) return;

    const d = json.data;
    renderScopeBar(d.total || 0);
    animateCount('kpiTotal', d.total || 0);
    animateCount('kpiOpen', d.open || 0);
    animateCount('kpiResolved', d.resolved || 0);
    animateCount('kpiEscalated', d.escalated || 0);
    
    document.getElementById('kpiAvgTime').textContent = (d.avgResolutionTimeHours || 0) + 'h';
    document.getElementById('kpiSLA').textContent = (d.slaComplianceRate || 0) + '%';
  } catch (err) {
    console.error('Error loading KPIs:', err);
  }
}

function animateCount(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  if (isNaN(start)) {
    el.textContent = target;
    return;
  }
  const duration = 600;
  const steps = 20;
  const stepTime = duration / steps;
  let currentStep = 0;

  const timer = setInterval(() => {
    currentStep++;
    const val = Math.round(start + (target - start) * (currentStep / steps));
    el.textContent = val;
    if (currentStep >= steps) {
      el.textContent = target;
      clearInterval(timer);
    }
  }, stepTime);
}

// ---------------------------------------------------------------
// 2. Systemic Pattern Alerts & Category Chart
// ---------------------------------------------------------------
async function fetchPatterns() {
  try {
    const res = await fetch(`${API_BASE}/analytics/patterns`, { headers: getAuthHeaders() });
    const json = await res.json();
    if (!json.success || !json.data) return;

    const { alerts, byCategory, byDepartment } = json.data;

    // Render Alerts
    const section = document.getElementById('alertsSection');
    const grid = document.getElementById('alertsGrid');
    grid.innerHTML = '';

    if (alerts && alerts.length > 0) {
      section.style.display = 'block';
      alerts.forEach(a => {
        const card = document.createElement('div');
        card.className = `alert-card ${a.severity.toLowerCase()}`;
        const iconSvg = a.severity === 'CRITICAL'
          ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:-2px;margin-right:6px;"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
          : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:-2px;margin-right:6px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
        card.innerHTML = `
          <div class="alert-title">${iconSvg}<span>${a.type}: ${a.category || a.department}</span></div>
          <div class="alert-message">${escapeHtml(a.message)}</div>
        `;
        grid.appendChild(card);
      });
    } else {
      section.style.display = 'none';
    }

    // Render Category Chart
    if (byCategory && byCategory.length > 0) {
      renderCategoryChart(byCategory);
    }

    // Render Department Chart
    if (byDepartment && byDepartment.length > 0) {
      renderDepartmentChart(byDepartment);
    }
  } catch (err) {
    console.error('Error loading patterns:', err);
  }
}

function renderCategoryChart(data) {
  const ctx = document.getElementById('chartCategory');
  if (!ctx) return;

  if (categoryChart) categoryChart.destroy();

  const labels = data.map(d => d.category.replace(/_/g, ' '));
  const counts = data.map(d => d.count);

  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: CHART_COLORS.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 12, font: { family: 'Inter', size: 11 } }
        }
      }
    }
  });
}

function renderDepartmentChart(data) {
  const ctx = document.getElementById('chartDepartment');
  if (!ctx) return;

  if (deptChart) deptChart.destroy();

  // Aggregate by department
  const deptMap = {};
  data.forEach(item => {
    const dept = item.department || 'General';
    deptMap[dept] = (deptMap[dept] || 0) + item.count;
  });

  const labels = Object.keys(deptMap);
  const counts = Object.values(deptMap);

  deptChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Grievances',
        data: counts,
        backgroundColor: PALETTE.navy,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, font: { family: 'Inter', size: 11 } }
        },
        x: {
          ticks: { font: { family: 'Inter', size: 11 } }
        }
      }
    }
  });
}

// ---------------------------------------------------------------
// 3. SLA Compliance Chart
// ---------------------------------------------------------------
async function fetchSLACompliance() {
  try {
    const res = await fetch(`${API_BASE}/analytics/sla-compliance`, { headers: getAuthHeaders() });
    const json = await res.json();
    if (!json.success || !json.data) return;

    const { byCategory } = json.data;
    if (!byCategory || byCategory.length === 0) return;

    const ctx = document.getElementById('chartSLA');
    if (!ctx) return;

    if (slaChart) slaChart.destroy();

    const labels = byCategory.map(c => c.category.replace(/_/g, ' '));
    const onTime = byCategory.map(c => c.on_time || 0);
    const breached = byCategory.map(c => (c.breached || 0) + (c.currently_breached || 0));

    slaChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'On Time',
            data: onTime,
            backgroundColor: PALETTE.green,
            borderRadius: 4
          },
          {
            label: 'Breached',
            data: breached,
            backgroundColor: PALETTE.red,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, ticks: { font: { family: 'Inter', size: 10 } } },
          y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Inter', size: 11 } } }
        },
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Inter', size: 11 } } }
        }
      }
    });
  } catch (err) {
    console.error('Error loading SLA chart:', err);
  }
}

// ---------------------------------------------------------------
// 4. Satisfaction Chart
// ---------------------------------------------------------------
async function fetchSatisfaction() {
  try {
    const res = await fetch(`${API_BASE}/analytics/satisfaction`, { headers: getAuthHeaders() });
    const json = await res.json();
    if (!json.success || !json.data) return;

    const { distribution } = json.data;
    const ctx = document.getElementById('chartSatisfaction');
    if (!ctx) return;

    if (satisfactionChart) satisfactionChart.destroy();

    const ratingMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (distribution) {
      distribution.forEach(d => {
        ratingMap[d.rating] = d.count;
      });
    }

    satisfactionChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['1 (Poor)', '2 (Fair)', '3 (Average)', '4 (Good)', '5 (Excellent)'],
        datasets: [{
          label: 'Ratings',
          data: [ratingMap[1], ratingMap[2], ratingMap[3], ratingMap[4], ratingMap[5]],
          backgroundColor: [
            PALETTE.red,
            PALETTE.orange,
            '#facc15',
            '#4ade80',
            PALETTE.green
          ],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Inter', size: 11 } } },
          x: { ticks: { font: { family: 'Inter', size: 10 } } }
        }
      }
    });
  } catch (err) {
    console.error('Error loading satisfaction chart:', err);
  }
}

// ---------------------------------------------------------------
// 5. Heatmap: Department × Category
// ---------------------------------------------------------------
async function fetchHeatmap() {
  try {
    const res = await fetch(`${API_BASE}/analytics/heatmap`, { headers: getAuthHeaders() });
    const json = await res.json();
    const container = document.getElementById('heatmapWrapper');

    if (!json.success || !json.data || json.data.length === 0) {
      container.innerHTML = '<p class="empty-state">No departmental grievance data recorded yet.</p>';
      return;
    }

    const data = json.data;

    // Distinct departments & categories
    const depts = [...new Set(data.map(d => d.dept_name || 'General'))].sort();
    const categories = [...new Set(data.map(d => d.category))].sort();

    // Build lookup matrix
    const matrix = {};
    data.forEach(d => {
      const dept = d.dept_name || 'General';
      if (!matrix[dept]) matrix[dept] = {};
      matrix[dept][d.category] = d.count;
    });

    let html = '<table class="heatmap-table"><thead><tr><th>Department</th>';
    categories.forEach(cat => {
      html += `<th>${cat.replace(/_/g, ' ')}</th>`;
    });
    html += '<th>Total</th></tr></thead><tbody>';

    depts.forEach(dept => {
      html += `<tr><td class="dept-name">${escapeHtml(dept)}</td>`;
      let deptTotal = 0;
      categories.forEach(cat => {
        const count = (matrix[dept] && matrix[dept][cat]) || 0;
        deptTotal += count;
        let heatClass = 'heat-0';
        if (count >= 5) heatClass = 'heat-4';
        else if (count >= 3) heatClass = 'heat-3';
        else if (count >= 2) heatClass = 'heat-2';
        else if (count >= 1) heatClass = 'heat-1';

        html += `<td class="${heatClass}">${count}</td>`;
      });
      html += `<td style="font-weight:700; background:var(--primary-light); color:var(--primary);">${deptTotal}</td></tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (err) {
    console.error('Error loading heatmap:', err);
  }
}

// ---------------------------------------------------------------
// ---------------------------------------------------------------
// 6. Escalation Log
// ---------------------------------------------------------------
async function fetchEscalationLog() {
  try {
    const res = await fetch(`${API_BASE}/admin/escalation-log`, { headers: getAuthHeaders() });
    const json = await res.json();
    const container = document.getElementById('escalationLog');

    if (!json.success || !json.data || json.data.length === 0) {
      container.innerHTML = '<p class="empty-state">No escalation events recorded.</p>';
      return;
    }

    const events = json.data;
    let html = '';
    events.forEach(e => {
      const timeStr = new Date(e.occurred_at).toLocaleString();
      html += `
        <div class="esc-event">
          <div class="esc-dot"></div>
          <div style="flex:1;">
            <div class="esc-ref">Ref: ${escapeHtml(e.grievance_no)} · Category: ${escapeHtml(e.category)}</div>
            <div class="esc-notes">${escapeHtml(e.notes || 'SLA breached — automatically escalated to higher authority')}</div>
            <div class="esc-time"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${timeStr}</div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (err) {
    console.error('Error loading escalation log:', err);
  }
}

// ---------------------------------------------------------------
// 7. Case Register & Incident Audit
// ---------------------------------------------------------------
let allLoadedCases = [];
let activeCaseFilter = 'ALL';
let currentCaseSearchQuery = '';
let activeDossierCase = null;

async function fetchCaseRegister() {
  try {
    const res = await fetch(`${API_BASE}/grievances?limit=100`, { headers: getAuthHeaders() });
    const json = await res.json();
    const tbody = document.getElementById('caseTableBody');

    if (!json.success || !json.data || json.data.length === 0) {
      allLoadedCases = [];
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No grievances found within active jurisdiction</td></tr>';
      updateCaseCounter(0, 0);
      return;
    }

    allLoadedCases = json.data;
    applyCaseFilters();
  } catch (err) {
    console.error('Error loading case register:', err);
    const tbody = document.getElementById('caseTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state" style="color:var(--accent);">Failed to load case register. Please refresh.</td></tr>';
    }
  }
}

function updateCaseCounter(visibleCount, totalCount) {
  const badge = document.getElementById('caseCounterBadge');
  if (badge) {
    badge.textContent = `Showing ${visibleCount} of ${totalCount} cases`;
  }
}

function applyCaseFilters() {
  if (!allLoadedCases) return;

  const filtered = allLoadedCases.filter(c => {
    // 1. Status / Group filter
    let matchesGroup = true;
    if (activeCaseFilter === 'OPEN') {
      matchesGroup = c.status === 'RECEIVED' || c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS';
    } else if (activeCaseFilter === 'RESOLVED') {
      matchesGroup = c.status === 'RESOLVED' || c.status === 'CLOSED';
    } else if (activeCaseFilter === 'ESCALATED') {
      matchesGroup = c.status === 'ESCALATED' || (c.escalation_level && c.escalation_level > 1);
    } else if (activeCaseFilter === 'CRITICAL') {
      matchesGroup = c.severity === 'CRITICAL' || c.severity === 'HIGH';
    } else if (activeCaseFilter === 'WHISTLEBLOWER') {
      matchesGroup = c.is_anonymous === 1 || c.is_anonymous === true;
    }

    if (!matchesGroup) return false;

    // 2. Search query filter
    if (currentCaseSearchQuery) {
      const q = currentCaseSearchQuery;
      const refMatch = (c.grievance_no || '').toLowerCase().includes(q);
      const catMatch = (c.category || '').toLowerCase().includes(q);
      const descMatch = (c.description || '').toLowerCase().includes(q);
      const studentMatch = (c.student_name || '').toLowerCase().includes(q);
      const deptMatch = (c.department_name || c.department_code || '').toLowerCase().includes(q);
      const roleMatch = (c.assigned_to_role || '').toLowerCase().includes(q);
      return refMatch || catMatch || descMatch || studentMatch || deptMatch || roleMatch;
    }

    return true;
  });

  updateCaseCounter(filtered.length, allLoadedCases.length);
  renderCaseTable(filtered);
}

function setCaseFilter(filterType) {
  activeCaseFilter = filterType;

  // Update filter pills UI
  const pills = document.querySelectorAll('#caseFilterPills .filter-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-filter') === filterType) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  // Update active KPI outline
  document.querySelectorAll('.kpi-card').forEach(c => c.classList.remove('active-kpi'));
  if (filterType === 'ALL') {
    document.getElementById('kpiCardTotal')?.classList.add('active-kpi');
  } else if (filterType === 'OPEN') {
    document.getElementById('kpiCardOpen')?.classList.add('active-kpi');
  } else if (filterType === 'RESOLVED') {
    document.getElementById('kpiCardResolved')?.classList.add('active-kpi');
  } else if (filterType === 'ESCALATED') {
    document.getElementById('kpiCardEscalated')?.classList.add('active-kpi');
  } else if (filterType === 'CRITICAL') {
    document.getElementById('kpiCardSLA')?.classList.add('active-kpi');
  }

  applyCaseFilters();
}
window.setCaseFilter = setCaseFilter;

function handleCaseSearch(query) {
  currentCaseSearchQuery = (query || '').toLowerCase().trim();
  const clearBtn = document.getElementById('caseSearchClear');
  if (clearBtn) {
    clearBtn.style.display = currentCaseSearchQuery ? 'flex' : 'none';
  }
  applyCaseFilters();
}
window.handleCaseSearch = handleCaseSearch;

function clearCaseSearch() {
  const input = document.getElementById('caseSearchInput');
  if (input) input.value = '';
  const clearBtn = document.getElementById('caseSearchClear');
  if (clearBtn) clearBtn.style.display = 'none';
  currentCaseSearchQuery = '';
  applyCaseFilters();
}
window.clearCaseSearch = clearCaseSearch;

function filterCaseRegisterByKPI(kpiType) {
  setCaseFilter(kpiType);

  const section = document.getElementById('caseRegisterSection');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    section.style.transition = 'box-shadow 0.4s ease';
    section.style.boxShadow = '0 0 0 3px rgba(26,60,125,0.25)';
    setTimeout(() => {
      section.style.boxShadow = '';
    }, 1400);
  }
}
window.filterCaseRegisterByKPI = filterCaseRegisterByKPI;

function formatAdminAuthorityName(role) {
  if (!role) return 'Departments HOD';
  if (role === 'HOD') return 'Departments HOD';
  if (role === 'GRIEVANCE_COMMITTEE' || role === 'GRIEVANCE_CELL' || role === 'DEAN_STUDENT_AFFAIRS') return 'Grievance Committee';
  if (role === 'ANTI_RAGGING_COMMITTEE' || role === 'ICC' || role === 'SAFETY_COMMITTEE') return 'Anti-Ragging & Student Comm.';
  return role.replace(/_/g, ' ');
}

function formatAdminCategoryName(cat) {
  if (!cat) return 'General';
  if (['ACADEMIC', 'EXAMINATION', 'FACULTY_CONDUCT'].includes(cat)) return 'Departments HOD';
  if (['OTHER', 'HOSTEL', 'TRANSPORT', 'INFRASTRUCTURE', 'FEE'].includes(cat)) return 'Grievance Committee';
  if (['RAGGING', 'HARASSMENT', 'DISCRIMINATION', 'SAFETY'].includes(cat)) return 'Anti-Ragging & Student Comm.';
  return cat.replace(/_/g, ' ');
}

function renderCaseTable(cases) {
  const tbody = document.getElementById('caseTableBody');
  if (!tbody) return;

  if (cases.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No cases match the selected filter criteria.</td></tr>';
    return;
  }

  let html = '';
  cases.forEach(c => {
    const sevClass = `tbadge-${(c.severity || 'low').toLowerCase()}`;

    // SLA Calculation
    let slaHtml = '<span class="sla-ok">Within SLA</span>';
    if (c.resolved_at && c.sla_due_at) {
      if (new Date(c.resolved_at) > new Date(c.sla_due_at)) {
        slaHtml = '<span class="sla-breach">Breached (Late)</span>';
      } else {
        slaHtml = '<span class="sla-ok">Resolved On-Time</span>';
      }
    } else if (c.sla_due_at) {
      const now = new Date();
      const due = new Date(c.sla_due_at);
      if (now > due) {
        const hoursOver = Math.round((now - due) / (1000 * 60 * 60));
        slaHtml = `<span class="sla-breach">Breached (+${hoursOver}h)</span>`;
      } else {
        const hoursLeft = Math.round((due - now) / (1000 * 60 * 60));
        if (hoursLeft < 12) {
          slaHtml = `<span class="sla-warn">Due in ${hoursLeft}h</span>`;
        } else {
          slaHtml = `<span class="sla-ok">Due in ${hoursLeft}h</span>`;
        }
      }
    }

    // Complainant Cell
    let complainantHtml = '';
    if (c.is_anonymous) {
      complainantHtml = `
        <span class="whistleblower-shield-badge" title="Identity protected per statutory confidentiality guidelines">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span>Whistleblower</span>
        </span>
      `;
    } else {
      const studentName = c.student_name || 'Registered Student';
      const studentDept = c.department_name || c.department_code || 'General';
      complainantHtml = `
        <div class="complainant-cell">
          <span class="complainant-name">${escapeHtml(studentName)}</span>
          <span class="complainant-dept">${escapeHtml(studentDept)}</span>
        </div>
      `;
    }

    // Status Cell with Student Feedback Indicator
    let statusBadgeHtml = '';
    if (c.status === 'RESOLVED' && !c.satisfaction_rating) {
      statusBadgeHtml = `
        <span class="table-badge" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a;">RESOLVED</span>
        <div style="font-size:10px; color:#d97706; font-weight:600; margin-top:3px; display:flex; align-items:center; gap:3px;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>Awaiting Feedback</span>
        </div>
      `;
    } else if (c.status === 'CLOSED' || c.satisfaction_rating) {
      statusBadgeHtml = `
        <span class="table-badge" style="background:#dcfce7; color:#15803d; border:1px solid #bbf7d0;">CLOSED</span>
        <div style="font-size:10px; color:#16a34a; font-weight:600; margin-top:3px; display:flex; align-items:center; gap:2px;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#eab308" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <span>Feedback: ${c.satisfaction_rating || 5}/5</span>
        </div>
      `;
    } else if (c.status === 'ESCALATED') {
      statusBadgeHtml = `<span class="table-badge" style="background:#fee2e2; color:#b91c1c;">ESCALATED</span>`;
    } else if (c.status === 'IN_PROGRESS') {
      statusBadgeHtml = `<span class="table-badge" style="background:#e0e7ff; color:#4338ca;">IN PROGRESS</span>`;
    } else {
      statusBadgeHtml = `<span class="table-badge" style="background:#e0f2fe; color:#0369a1;">${escapeHtml(c.status || 'RECEIVED')}</span>`;
    }

    html += `
      <tr onclick="openCaseDossier('${escapeHtml(c.grievance_no)}')" title="Click to view full case details">
        <td><strong style="color:var(--primary); font-family:monospace; font-size:12.5px;">${escapeHtml(c.grievance_no)}</strong></td>
        <td>${complainantHtml}</td>
        <td><span class="problem-snippet" title="${escapeHtml(c.description)}">${escapeHtml(c.description)}</span></td>
        <td>${escapeHtml(formatAdminCategoryName(c.category))}</td>
        <td><span class="table-badge ${sevClass}">${escapeHtml(c.severity || 'NORMAL')}</span></td>
        <td>${statusBadgeHtml}</td>
        <td>${slaHtml}</td>
        <td style="text-align:center;">
          <button type="button" class="btn-view-dossier" onclick="event.stopPropagation(); openCaseDossier('${escapeHtml(c.grievance_no)}')" title="View Case Dossier">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Dossier</span>
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// ---------------------------------------------------------------
// Case Dossier Modal Logic
// ---------------------------------------------------------------
async function openCaseDossier(idOrNo) {
  const modal = document.getElementById('caseDetailModal');
  if (!modal) return;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Placeholder state while fetching
  document.getElementById('dossierRefNo').textContent = idOrNo;
  document.getElementById('complainantCardContent').innerHTML = '<p class="empty-state">Loading complainant identification...</p>';
  document.getElementById('dossierProblemText').textContent = 'Loading incident problem narrative...';
  document.getElementById('dossierKeywordsWrap').innerHTML = '';
  const precInit = document.getElementById('dossierPrecedentsContent');
  if (precInit) precInit.innerHTML = '<p class="empty-state">Searching historical case rulings...</p>';
  document.getElementById('dossierTimeline').innerHTML = '<p class="empty-state">Loading lifecycle events...</p>';
  document.getElementById('dossierResolutionBox').style.display = 'none';
  const initActionBox = document.getElementById('dossierResolutionActionBox');
  if (initActionBox) initActionBox.style.display = 'none';

  try {
    const res = await fetch(`${API_BASE}/grievances/${encodeURIComponent(idOrNo)}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!json.success || !json.data) {
      document.getElementById('dossierProblemText').textContent = 'Failed to load case details.';
      return;
    }

    const d = json.data;
    activeDossierCase = d;

    // Header
    document.getElementById('dossierRefNo').textContent = d.grievance_no;

    const catEl = document.getElementById('dossierCategory');
    catEl.textContent = formatAdminCategoryName(d.category);
    catEl.style.background = '#e8eef8';
    catEl.style.color = '#1a3c7d';

    const sevEl = document.getElementById('dossierSeverity');
    sevEl.textContent = d.severity || 'NORMAL';
    sevEl.className = `dossier-tag tbadge-${(d.severity || 'normal').toLowerCase()}`;

    const statEl = document.getElementById('dossierStatus');
    statEl.textContent = d.status || 'RECEIVED';
    statEl.style.background = d.status === 'RESOLVED' ? '#dcfce7' : (d.status === 'ESCALATED' ? '#fee2e2' : '#e0f2fe');
    statEl.style.color = d.status === 'RESOLVED' ? '#15803d' : (d.status === 'ESCALATED' ? '#b91c1c' : '#0369a1');

    // 1. Complainant Identity
    const compBox = document.getElementById('complainantCardContent');
    if (d.is_anonymous) {
      compBox.innerHTML = `
        <div class="whistleblower-box">
          <div class="whistleblower-box-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div>
            <div class="whistleblower-title">Statutory Whistleblower Protection Active</div>
            <p class="whistleblower-desc">
              Complainant identity is encrypted and legally shielded in accordance with UGC Redressal Regulations (2023) and statutory safety mandates. Personal student identifiers are withheld to ensure immunity against academic or personal retaliation.
            </p>
            <div style="margin-top:8px; font-size:11.5px; color:#92400e; font-weight:600;">
              Jurisdiction Department: ${escapeHtml(d.department_name || d.department_code || 'Institutional Oversight')}
            </div>
          </div>
        </div>
      `;
    } else {
      const studentName = d.student_name || 'Registered Student';
      const studentId = d.student_username || d.student_id || 'N/A';
      const studentEmail = d.student_email || 'Not on file';
      const studentDept = d.department_name || d.department_code || 'General Department';

      compBox.innerHTML = `
        <div class="student-profile-strip">
          <div class="student-profile-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class="student-profile-details">
            <div class="student-profile-name">
              <span>${escapeHtml(studentName)}</span>
              <span class="verified-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Verified Student
              </span>
            </div>
            <div class="student-profile-meta">
              <strong>Roll / ID:</strong> ${escapeHtml(studentId)} · <strong>Dept:</strong> ${escapeHtml(studentDept)}
            </div>
            <div class="student-profile-email">
              ${escapeHtml(studentEmail)}
            </div>
          </div>
        </div>
      `;
    }

    // 2. Grievance Problem Narrative
    document.getElementById('dossierProblemText').textContent = d.description || 'No problem narrative provided.';
    document.getElementById('dossierSubmittedAt').textContent = new Date(d.submitted_at).toLocaleString();
    document.getElementById('dossierChannel').textContent = d.submitted_via || 'WEB PORTAL';

    // 2b. Vernacular Telugu Original Transcript
    const vernBox = document.getElementById('dossierVernacularBox');
    const vernText = document.getElementById('dossierVernacularText');
    if (d.original_transcript) {
      if (vernBox) vernBox.style.display = 'block';
      if (vernText) vernText.textContent = d.original_transcript;
    } else {
      if (vernBox) vernBox.style.display = 'none';
    }

    // 2c. Submitted Evidence & Attachments
    const attachBox = document.getElementById('dossierAttachmentBox');
    const attachContent = document.getElementById('dossierAttachmentContent');
    if (d.attachment_data) {
      if (attachBox) attachBox.style.display = 'block';
      const isImg = (d.attachment_type || '').startsWith('image/');
      const attachName = d.attachment_name || (isImg ? 'evidence_photo.jpg' : 'evidence_doc.pdf');

      if (isImg) {
        attachContent.innerHTML = `
          <div class="dossier-media-card">
            <div class="dossier-media-preview" onclick="window.open('${d.attachment_data}', '_blank')">
              <img src="${d.attachment_data}" alt="${escapeHtml(attachName)}" class="dossier-evidence-img">
              <div class="media-overlay-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                <span>Click to Expand</span>
              </div>
            </div>
            <div class="dossier-media-footer">
              <span class="media-filename">${escapeHtml(attachName)}</span>
              <a href="${d.attachment_data}" download="${escapeHtml(attachName)}" class="btn-dossier-download">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download Evidence
              </a>
            </div>
          </div>
        `;
      } else {
        attachContent.innerHTML = `
          <div class="dossier-file-card">
            <div class="dossier-file-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
            <div class="dossier-file-info">
              <span class="dossier-file-name">${escapeHtml(attachName)}</span>
              <span class="dossier-file-type">Official PDF Case Documentation · Encrypted Evidence</span>
            </div>
            <a href="${d.attachment_data}" download="${escapeHtml(attachName)}" class="btn-dossier-download">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Download PDF
            </a>
          </div>
        `;
      }
    } else {
      if (attachBox) attachBox.style.display = 'none';
    }

    // 3. AI Classifier Insights
    const conf = Math.round((d.classifier_confidence || 0.88) * 100);
    document.getElementById('dossierConfText').textContent = `${conf}%`;
    document.getElementById('dossierConfBar').style.width = `${conf}%`;

    let keywords = [];
    try {
      if (d.classifier_keywords) {
        keywords = typeof d.classifier_keywords === 'string' ? JSON.parse(d.classifier_keywords) : d.classifier_keywords;
      }
    } catch (e) {
      keywords = [];
    }
    const kwWrap = document.getElementById('dossierKeywordsWrap');
    if (keywords && keywords.length > 0) {
      kwWrap.innerHTML = keywords.map(k => `<span class="keyword-pill">${escapeHtml(k)}</span>`).join('');
    } else {
      kwWrap.innerHTML = '<span style="font-size:11px; color:var(--text-muted);">Standard pattern classification</span>';
    }

    // 4. Jurisdiction & Routing
    document.getElementById('dossierAssignedRole').textContent = formatAdminAuthorityName(d.assigned_to_role);
    document.getElementById('dossierCommittee').textContent = d.committee_name || 'Academic Redressal Cell';
    document.getElementById('dossierEscalationLevel').textContent = `Tier ${d.escalation_level || 1} of 3`;
    document.getElementById('dossierStatutory').textContent = d.is_statutory_route ? 'Statutory UGC Fast-Track' : 'Standard Institutional Route';

    // 5. SLA Target & Velocity
    const slaStrip = document.getElementById('dossierSLAStrip');
    const dueTime = d.sla_due_at ? new Date(d.sla_due_at) : null;
    const now = new Date();
    let slaBadge = '<span class="sla-ok">Within Compliance Window</span>';
    let slaDetail = 'SLA monitoring active.';

    if (d.resolved_at && dueTime) {
      const resTime = new Date(d.resolved_at);
      if (resTime > dueTime) {
        slaBadge = '<span class="sla-breach">Breached (Resolved Late)</span>';
        slaDetail = `Target resolution was ${dueTime.toLocaleString()}, resolved at ${resTime.toLocaleString()}.`;
      } else {
        slaBadge = '<span class="sla-ok">Resolved On-Time</span>';
        slaDetail = `Successfully resolved within statutory threshold (${resTime.toLocaleString()}).`;
      }
    } else if (dueTime) {
      if (now > dueTime) {
        const hoursOver = Math.round((now - dueTime) / (1000 * 60 * 60));
        slaBadge = `<span class="sla-breach">SLA Breached (+${hoursOver}h Overdue)</span>`;
        slaDetail = `Breached deadline: ${dueTime.toLocaleString()}. Automatically flagged for escalation.`;
      } else {
        const hoursLeft = Math.round((dueTime - now) / (1000 * 60 * 60));
        slaBadge = hoursLeft < 12 
          ? `<span class="sla-warn">Warning: Due in ${hoursLeft} Hours</span>` 
          : `<span class="sla-ok">On Track: Due in ${hoursLeft} Hours</span>`;
        slaDetail = `SLA target deadline: ${dueTime.toLocaleString()}.`;
      }
    }

    slaStrip.innerHTML = `
      <div class="sla-progress-box">
        <div class="sla-progress-head">
          <span class="kv-label">Status</span>
          ${slaBadge}
        </div>
        <div class="sla-due-line">${escapeHtml(slaDetail)}</div>
      </div>
    `;

    // 6. Resolution Record (if resolved) vs Resolution Action Box (if unresolved)
    const resBox = document.getElementById('dossierResolutionBox');
    const resActionBox = document.getElementById('dossierResolutionActionBox');
    const resContent = document.getElementById('dossierResolutionContent');
    const isResolved = d.status === 'RESOLVED' || d.status === 'CLOSED' || Boolean(d.resolution);

    if (isResolved) {
      if (resBox) resBox.style.display = 'flex';
      if (resActionBox) resActionBox.style.display = 'none';

      let feedbackBlock = '';
      if (d.satisfaction_rating) {
        let starsSvg = '';
        for (let i = 1; i <= 5; i++) {
          const filled = i <= d.satisfaction_rating;
          starsSvg += `<svg width="14" height="14" viewBox="0 0 24 24" fill="${filled ? '#eab308' : 'none'}" stroke="${filled ? '#eab308' : '#cbd5e1'}" stroke-width="2" style="margin-right:1px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
        }
        feedbackBlock = `
          <div class="dossier-feedback-received-card">
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
              <div style="display:flex; align-items:center; gap:6px; font-weight:700; color:#15803d; font-size:12.5px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <span>Student Feedback Verified · Case Officially CLOSED</span>
              </div>
              <div style="display:inline-flex; align-items:center; gap:4px; background:#fef9c3; border:1px solid #fde047; padding:3px 9px; border-radius:12px; font-size:12px; font-weight:700; color:#854d0e;">
                <span>${d.satisfaction_rating} / 5 Stars</span>
                <div style="display:inline-flex; align-items:center;">${starsSvg}</div>
              </div>
            </div>
            ${d.satisfaction_comment ? `
              <div style="margin-top:8px; font-size:12.5px; color:#1e293b; background:#ffffff; padding:8px 12px; border-radius:6px; border:1px solid #bbf7d0; font-style:italic;">
                "${escapeHtml(d.satisfaction_comment)}"
              </div>
            ` : '<div style="margin-top:4px; font-size:11.5px; color:#64748b; font-style:italic;">No additional written comments provided by student.</div>'}
          </div>
        `;
      } else {
        feedbackBlock = `
          <div class="dossier-feedback-pending-card">
            <div style="display:flex; align-items:center; gap:6px; font-weight:700; color:#b45309; font-size:12.5px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>Status: RESOLVED · Awaiting Student Redressal Feedback</span>
            </div>
            <div style="font-size:12px; color:#92400e; margin-top:4px; line-height:1.45;">
              Official resolution recorded by authority. Under university grievance redressal protocol, final case closure is completed once the complainant reviews the order and submits their satisfaction rating on the student portal.
            </div>
          </div>
        `;
      }

      resContent.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;">
          <div style="font-size:13px; color:var(--text-primary); line-height:1.5; background:#f0fdf4; border-left:3.5px solid #16a34a; padding:10px 14px; border-radius:6px;">
            ${escapeHtml(d.resolution || 'Resolution recorded.')}
          </div>
          <div style="font-size:11.5px; color:var(--text-muted); display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px; align-items:center;">
            <span><strong>Resolved Date:</strong> ${d.resolved_at ? new Date(d.resolved_at).toLocaleString() : 'N/A'}</span>
          </div>
          ${feedbackBlock}
        </div>
      `;
    } else {
      if (resBox) resBox.style.display = 'none';
      if (resActionBox) {
        resActionBox.style.display = 'flex';
        const input = document.getElementById('dossierResolutionInput');
        if (input) input.value = '';
        const count = document.getElementById('dossierCharCount');
        if (count) {
          count.textContent = '0';
          count.parentElement.classList.remove('valid');
        }
        const btn = document.getElementById('btnSubmitResolution');
        if (btn) btn.disabled = true;
        const alert = document.getElementById('dossierResolutionAlert');
        if (alert) {
          alert.style.display = 'none';
          alert.textContent = '';
        }
      }
    }

    // 6c. Multi-Channel WhatsApp & SMS Dispatch Log
    const dispatchBox = document.getElementById('dossierDispatchBox');
    const dispatchList = document.getElementById('dossierDispatchList');
    if (dispatchBox) dispatchBox.style.display = 'block';
    if (dispatchList) {
      let dispatchHtml = renderWhatsAppTranscript(d, true);

      if (d.dispatch_logs && d.dispatch_logs.length > 0) {
        dispatchHtml += `
          <div style="margin-top: 14px; margin-bottom: 6px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <span>Carrier Gateway Telemetry (${d.dispatch_logs.length} Logged)</span>
          </div>
        `;
        d.dispatch_logs.forEach(log => {
          const isAlert = log.alert_type === 'EMERGENCY_SOS';
          const isResolve = log.alert_type === 'CASE_RESOLVED';
          const badgeColor = isAlert ? '#fee2e2' : (isResolve ? '#dcfce7' : '#e0f2fe');
          const textColor = isAlert ? '#991b1b' : (isResolve ? '#166534' : '#0369a1');
          const borderCol = isAlert ? '#fca5a5' : (isResolve ? '#86efac' : '#7dd3fc');
          const channelTitle = isAlert ? 'Anti-Ragging Squad SOS' : (isResolve ? 'Resolution & Rating' : 'Intake Acknowledgement');

          dispatchHtml += `
            <div class="dispatch-log-card" style="border-left: 3.5px solid ${textColor}; margin-top: 8px;">
              <div class="dispatch-log-header">
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="background:${badgeColor}; color:${textColor}; border:1px solid ${borderCol}; padding:2px 8px; border-radius:10px; font-size:10.5px; font-weight:700;">
                    ${log.channel || 'WHATSAPP'}
                  </span>
                  <strong style="font-size:12px; color:#1e293b;">${channelTitle}</strong>
                </div>
                <span class="dispatch-status-badge" style="background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0;">
                  ${escapeHtml(log.status || 'DELIVERED')}
                </span>
              </div>
              <div class="dispatch-recipient">Recipient: <strong>${escapeHtml(log.recipient_phone || 'Authority Gate')}</strong> · Sent: ${new Date(log.dispatched_at).toLocaleString()}</div>
              <div class="dispatch-transcript">"${escapeHtml(log.message_body)}"</div>
            </div>
          `;
        });
      }
      dispatchList.innerHTML = dispatchHtml;
    }

    // 7. Lifecycle Audit Trail
    const timeline = document.getElementById('dossierTimeline');
    if (d.events && d.events.length > 0) {
      timeline.innerHTML = d.events.map(e => {
        const timeStr = new Date(e.occurred_at).toLocaleString();
        const roleStr = e.actor_name ? `${e.actor_name} (${e.actor_role || 'Authority'})` : (e.actor_role || 'System Agent');
        return `
          <div class="timeline-item">
            <div class="timeline-marker"></div>
            <div class="timeline-title">
              <span>${escapeHtml(e.event_type)}</span>
              <span class="timeline-time">${timeStr}</span>
            </div>
            <div class="timeline-note">
              <strong>${escapeHtml(roleStr)}</strong>: ${escapeHtml(e.notes || 'Status updated')}
            </div>
          </div>
        `;
      }).join('');
    } else {
      timeline.innerHTML = '<p class="empty-state">No timeline events recorded.</p>';
    }

    // 8. Load Precedents & Similar Historical Case Rulings
    fetch(`${API_BASE}/grievances/${encodeURIComponent(d.grievance_no)}/precedents`, {
      headers: getAuthHeaders()
    })
    .then(r => r.json())
    .then(pJson => {
      const precBox = document.getElementById('dossierPrecedentsContent');
      if (!precBox) return;
      if (!pJson.success || !pJson.data || pJson.data.length === 0) {
        precBox.innerHTML = '<p class="empty-state">No matching historical rulings found for this category.</p>';
        return;
      }
      precBox.innerHTML = pJson.data.map(p => `
        <div class="precedent-card">
          <div class="precedent-head">
            <span class="precedent-ref">${escapeHtml(p.grievanceNo)}</span>
            <span class="precedent-score">${p.similarityScore}% Precedent Relevance</span>
          </div>
          <p class="precedent-summary">${escapeHtml(p.summary)}</p>
          <div class="precedent-resolution">
            <strong>Historical Ruling:</strong> ${escapeHtml(p.resolution)}
          </div>
          <div class="precedent-meta">
            <span><strong>Authority:</strong> ${escapeHtml(p.committee)}</span>
            <span><strong>Resolution Turnaround:</strong> ${p.resolutionHours}h</span>
          </div>
        </div>
      `).join('');
    })
    .catch(err => {
      console.warn('Precedent fetch error:', err);
      const precBox = document.getElementById('dossierPrecedentsContent');
      if (precBox) precBox.innerHTML = '<p class="empty-state">Unable to load past rulings.</p>';
    });

  } catch (err) {
    console.error('Failed to open case dossier:', err);
    document.getElementById('dossierProblemText').textContent = 'Error loading dossier: ' + err.message;
  }
}
window.openCaseDossier = openCaseDossier;

async function openResolutionLetterModal(grievanceNo) {
  const modal = document.getElementById('resolutionLetterModal');
  const paper = document.getElementById('resolutionLetterPaper');
  if (!modal || !paper) return;

  const targetNo = grievanceNo || activeDossierCase?.grievance_no;
  if (!targetNo) {
    showToast('No active grievance selected for resolution letter.', 'error');
    return;
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  paper.innerHTML = '<p class="empty-state">Generating official university resolution order...</p>';

  try {
    const res = await fetch(`${API_BASE}/grievances/${encodeURIComponent(targetNo)}/resolution-letter`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!json.success || !json.data) {
      paper.innerHTML = `<p class="empty-state">${escapeHtml(json.message || 'Resolution order unavailable.')}</p>`;
      return;
    }

    const d = json.data;
    const g = d.grievance;

    paper.innerHTML = `
      <div class="letter-hdr">
        <div class="letter-univ-title">${escapeHtml(d.institution.name)}</div>
        <div class="letter-univ-sub">${escapeHtml(d.institution.accreditation)}</div>
        <div class="letter-univ-sub">${escapeHtml(d.institution.location)}</div>
        <div class="letter-cell-title">${escapeHtml(d.institution.cell)}</div>
      </div>

      <div class="letter-meta-row">
        <div><strong>Order Dispatch Ref:</strong> ${escapeHtml(d.dispatchRef)}</div>
        <div><strong>Date of Issue:</strong> ${escapeHtml(d.issuanceDate)}</div>
      </div>

      <div class="letter-subject">
        SUBJECT: FORMAL REDRESSAL ORDER & FINDINGS DISPATCH IN RE: GRIEVANCE PETITION REF. NO. ${escapeHtml(g.grievanceNo)}
      </div>

      <table class="letter-details-table">
        <tr>
          <td class="label-col">Complainant Reference</td>
          <td><strong>${escapeHtml(g.complainantName)}</strong> (${escapeHtml(g.complainantRegdNo)})</td>
        </tr>
        <tr>
          <td class="label-col">Department / Faculty</td>
          <td>${escapeHtml(g.department)}</td>
        </tr>
        <tr>
          <td class="label-col">Grievance Category</td>
          <td>${escapeHtml(g.category)} (Severity: ${escapeHtml(g.severity)})</td>
        </tr>
        <tr>
          <td class="label-col">Petition Lodged Date</td>
          <td>${new Date(g.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
        </tr>
        <tr>
          <td class="label-col">Redressal Status</td>
          <td><strong style="color:#15803d;">COMPETENT AUTHORITY ORDER ISSUED (${escapeHtml(g.status)})</strong></td>
        </tr>
      </table>

      <div class="letter-section-heading">1. Statement of Grievance & Facts</div>
      <p class="letter-body-p">
        "${escapeHtml(g.description)}"
      </p>

      <div class="letter-section-heading">2. Regulatory & Institutional Governance Framework</div>
      <p class="letter-body-p">
        This proceeding has been conducted under the statutory provisions of the ${escapeHtml(d.regulatoryContext)}. The assigned authority has reviewed records, physical evidence, and institutional regulations.
      </p>

      <div class="letter-section-heading">3. Inquiry Findings & Prescribed Remedial Action</div>
      <p class="letter-body-p" style="background:#f8fafc; padding:12px 14px; border-left:3px solid #16a34a; font-family:'Inter',sans-serif; font-size:13px; line-height:1.6;">
        ${escapeHtml(d.findings)}
      </p>

      <div class="letter-section-heading">4. Appellate Rights & Appeal Protocol</div>
      <p class="letter-body-p">
        Pursuant to University Redressal Regulations, the complainant is entitled to appeal this decision within <strong>${d.appealProvisions.windowDays} days</strong> of receipt (Deadline: <strong>${escapeHtml(d.appealProvisions.deadline)}</strong>) before the <strong>${escapeHtml(d.appealProvisions.appellateAuthority)}</strong> via the ${escapeHtml(d.appealProvisions.mode)}.
      </p>

      <div class="letter-signatory-wrap">
        <div class="letter-signatory-box">
          <div class="letter-signatory-seal">BY ORDER OF THE AUTHORITY</div>
          <div style="height:32px;"></div>
          <div class="letter-signatory-name">${escapeHtml(d.signatory.name)}</div>
          <div class="letter-signatory-title">${escapeHtml(d.signatory.title)}</div>
          <div style="font-size:11px; color:#64748b;">${escapeHtml(d.signatory.body)}</div>
        </div>
      </div>

      <div class="letter-footer-note">
        <span>Official Verification Hash: <code>${escapeHtml(d.verificationCode)}</code></span>
        <span>Generated via Central Grievance Agent 46 (VFSTR)</span>
      </div>
    `;
  } catch (err) {
    paper.innerHTML = `<p class="empty-state">Failed to load resolution letter: ${escapeHtml(err.message)}</p>`;
  }
}
window.openResolutionLetterModal = openResolutionLetterModal;

function closeResolutionLetterModal() {
  const modal = document.getElementById('resolutionLetterModal');
  if (modal) modal.style.display = 'none';
  const caseModal = document.getElementById('caseDetailModal');
  if (!caseModal || caseModal.style.display === 'none') {
    document.body.style.overflow = '';
  }
}
window.closeResolutionLetterModal = closeResolutionLetterModal;

function closeCaseDossier() {
  const modal = document.getElementById('caseDetailModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
  activeDossierCase = null;
}
window.closeCaseDossier = closeCaseDossier;

function updateDossierCharCount() {
  const input = document.getElementById('dossierResolutionInput');
  const countEl = document.getElementById('dossierCharCount');
  const btn = document.getElementById('btnSubmitResolution');
  if (!input || !countEl || !btn) return;
  const len = input.value.trim().length;
  countEl.textContent = len;
  if (len >= 10) {
    countEl.parentElement.classList.add('valid');
    btn.disabled = false;
  } else {
    countEl.parentElement.classList.remove('valid');
    btn.disabled = true;
  }
}
window.updateDossierCharCount = updateDossierCharCount;

async function submitDossierResolution() {
  if (!activeDossierCase) return;
  const input = document.getElementById('dossierResolutionInput');
  const alertEl = document.getElementById('dossierResolutionAlert');
  const btn = document.getElementById('btnSubmitResolution');
  if (!input) return;

  const resolutionText = input.value.trim();
  if (resolutionText.length < 10) {
    if (alertEl) {
      alertEl.className = 'dossier-alert-banner alert-error';
      alertEl.textContent = 'Resolution rationale must be at least 10 characters long.';
      alertEl.style.display = 'block';
    }
    return;
  }

  const domRef = document.getElementById('dossierRefNo')?.textContent?.trim();
  const caseIdentifier = activeDossierCase?.grievance_no || activeDossierCase?.grievance_id || domRef;

  if (!caseIdentifier || caseIdentifier === '—') {
    if (alertEl) {
      alertEl.className = 'dossier-alert-banner alert-error';
      alertEl.textContent = 'Active grievance reference is missing. Please close and re-open this case from the register.';
      alertEl.style.display = 'block';
    }
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg><span>Recording Resolution...</span>`;

  try {
    const res = await fetch(`${API_BASE}/grievances/${encodeURIComponent(caseIdentifier)}/resolve`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        resolution: resolutionText,
        actor_user_id: currentAuthority?.id || currentAuthority?.username || 'OFFICER'
      })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || json.error || 'Failed to submit resolution');
    }

    if (alertEl) {
      alertEl.className = 'dossier-alert-banner alert-success';
      alertEl.textContent = 'Case successfully marked as RESOLVED. Notification dispatched to student.';
      alertEl.style.display = 'block';
    }

    showToast(`Case ${caseIdentifier} has been officially RESOLVED.`);

    // Trigger on-screen realistic WhatsApp Push Notification (Stage/Judge Presentation)
    setTimeout(() => {
      const studentName = activeDossierCase?.complainant_name || activeDossierCase?.student_name || 'Student';
      showWhatsAppPush({
        title: 'WHATSAPP • VIGNAN REDRESSAL ORDER',
        sender: 'Vignan University Redressal Order (Official ✓)',
        message: `Dear ${studentName},\nYour grievance *${caseIdentifier}* has been formally RESOLVED.\n\nOfficial Findings: "${resolutionText.slice(0, 110)}${resolutionText.length > 110 ? '...' : ''}"\n\nDirect carrier dispatch: WhatsApp notification & 5-star rating request triggered.`,
        actionText: 'View Resolution Order',
        actionCallback: () => {
          openResolutionLetterModal(caseIdentifier);
        }
      });
    }, 450);

    // Re-open dossier to display the resolution view & updated audit trail
    try {
      await openCaseDossier(caseIdentifier);
    } catch (e) {
      console.warn('Post-resolution dossier refresh note:', e);
    }


    // Refresh KPI counts and tables
    fetchKPIs();
    fetchCaseRegister();
    fetchEscalationLog();
  } catch (err) {
    console.error('Resolution error:', err);
    if (alertEl) {
      alertEl.className = 'dossier-alert-banner alert-error';
      alertEl.textContent = 'Failed to record resolution: ' + err.message;
      alertEl.style.display = 'block';
    }
    btn.disabled = false;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Confirm & Record Resolution</span>`;
  }
}
window.submitDossierResolution = submitDossierResolution;

function copyDossierRefNo() {
  const refNo = document.getElementById('dossierRefNo')?.textContent;
  if (!refNo) return;
  navigator.clipboard.writeText(refNo).then(() => {
    const textEl = document.getElementById('copyRefText');
    if (textEl) {
      const orig = textEl.textContent;
      textEl.textContent = 'Copied!';
      setTimeout(() => { textEl.textContent = orig; }, 1800);
    }
    showToast(`Case Reference ${refNo} copied to clipboard`);
  }).catch(() => {
    showToast(`Case Reference: ${refNo}`);
  });
}
window.copyDossierRefNo = copyDossierRefNo;

// ---------------------------------------------------------------
// 8. Trigger SLA Breach Scan
// ---------------------------------------------------------------
async function triggerSLACheck() {
  showToast('Running SLA compliance scan across active grievances...');
  try {
    const res = await fetch(`${API_BASE}/admin/sla-check`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' })
    });
    const json = await res.json();

    if (json.success && json.data) {
      const d = json.data;
      let msg = `SLA Scan Complete!\n• Scanned: ${d.scanned} active cases\n• Breached: ${d.breached}\n• Escalated: ${d.escalated}`;
      if (d.details && d.details.length > 0) {
        msg += `\n\nEscalations:\n` + d.details.map(det => `• ${det.grievanceNo}: ${det.from} → ${det.to} (${det.hoursOverdue}h overdue)`).join('\n');
      }
      showToast(msg);
      // Refresh dashboard data
      loadDashboard();
    } else {
      showToast('SLA scan completed: All active cases are within compliance threshold.');
    }
  } catch (err) {
    console.error('Error in SLA check:', err);
    showToast('Failed to run SLA scan: ' + err.message);
  }
}

// ---------------------------------------------------------------
// Top-Right Notifications & Institutional Notification Center
// Strict Rating Colors:
// - Rating 1 or 2: Red (#dc2626)
// - Rating 3: White (#ffffff)
// - Remaining (4 or 5): Green (#16a34a)
// - Escalations / SLA Breach: Crimson (#991b1b)
// ---------------------------------------------------------------

let seenNotificationIds = new Set();
let unreadNotifCount = 0;
let isFirstNotifLoad = true;

async function pollInstitutionalNotifications() {
  try {
    const res = await fetch(`${API_BASE}/admin/notifications`, { headers: getAuthHeaders() });
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) return;

    const notifs = json.data;

    if (isFirstNotifLoad) {
      notifs.forEach(n => seenNotificationIds.add(n.id || `${n.grievanceNo}_${n.type}_${n.timestamp}`));
      isFirstNotifLoad = false;
      renderNotificationDropdown(notifs);
      return;
    }

    // Identify brand new notifications not yet displayed as toasts
    const newAlerts = [];
    for (const notif of notifs) {
      const key = notif.id || `${notif.grievanceNo}_${notif.type}_${notif.timestamp}`;
      if (!seenNotificationIds.has(key)) {
        seenNotificationIds.add(key);
        newAlerts.push(notif);
      }
    }

    if (newAlerts.length > 0) {
      unreadNotifCount += newAlerts.length;
      updateNotifBadge();
      renderNotificationDropdown(notifs);

      // Pop up floating top-right toast for each new notification
      for (const notif of newAlerts) {
        triggerTopRightNotification(notif);
      }
    }
  } catch (err) {
    console.error('Error polling notifications:', err);
  }
}

function updateNotifBadge() {
  const badge = document.getElementById('notifCountBadge');
  if (!badge) return;
  if (unreadNotifCount > 0) {
    badge.textContent = unreadNotifCount > 9 ? '9+' : unreadNotifCount;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function toggleNotificationCenter() {
  const menu = document.getElementById('notifDropdownMenu');
  const btn = document.getElementById('notifBellBtn');
  if (!menu) return;
  const isVisible = menu.style.display === 'flex';
  if (isVisible) {
    menu.style.display = 'none';
    if (btn) btn.setAttribute('aria-expanded', 'false');
  } else {
    menu.style.display = 'flex';
    if (btn) btn.setAttribute('aria-expanded', 'true');
    // Refresh list
    fetch(`${API_BASE}/admin/notifications`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(j => { if (j.success && j.data) renderNotificationDropdown(j.data); })
      .catch(() => {});
  }
}
window.toggleNotificationCenter = toggleNotificationCenter;

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const wrapper = document.getElementById('notifBellWrapper');
  const menu = document.getElementById('notifDropdownMenu');
  if (menu && menu.style.display === 'flex') {
    if (wrapper && !wrapper.contains(e.target)) {
      menu.style.display = 'none';
      const btn = document.getElementById('notifBellBtn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  }
});

function clearAllNotifications() {
  unreadNotifCount = 0;
  updateNotifBadge();
  const listEl = document.getElementById('notifDropdownList');
  if (listEl) {
    listEl.querySelectorAll('.notif-item').forEach(item => {
      item.style.opacity = '0.65';
    });
  }
}
window.clearAllNotifications = clearAllNotifications;

function renderNotificationDropdown(notifs) {
  const listEl = document.getElementById('notifDropdownList');
  if (!listEl) return;

  if (!notifs || notifs.length === 0) {
    listEl.innerHTML = '<p class="notif-empty-state">No new alerts received</p>';
    return;
  }

  listEl.innerHTML = notifs.slice(0, 15).map(n => {
    let pillClass = 'pill-general';
    let pillLabel = n.type || 'NOTICE';

    if (n.type === 'FEEDBACK') {
      const r = Number(n.rating);
      if (r === 1 || r === 2) {
        pillClass = 'pill-rating-red';
        pillLabel = `Rating: ${r}/5 (Critical)`;
      } else if (r === 3) {
        pillClass = 'pill-rating-white';
        pillLabel = `Rating: ${r}/5 (Neutral)`;
      } else {
        pillClass = 'pill-rating-green';
        pillLabel = `Rating: ${r}/5 (Positive)`;
      }
    } else if (n.type === 'ESCALATION') {
      pillClass = 'pill-escalation';
      pillLabel = 'Escalated (SLA Breach)';
    } else if (n.type === 'RESOLUTION') {
      pillClass = 'pill-rating-green';
      pillLabel = 'Resolved';
    }

    const timeStr = n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';
    const clickHandler = n.grievanceId ? `onclick="openCaseDossier('${n.grievanceId}'); toggleNotificationCenter();"` : '';

    return `
      <div class="notif-item" ${clickHandler}>
        <div class="notif-item-top">
          <span class="notif-item-pill ${pillClass}">${escapeHtml(pillLabel)}</span>
          <span class="notif-item-time">${timeStr}</span>
        </div>
        <div class="notif-item-title">${escapeHtml(n.title || n.grievanceNo || 'Administrative Notice')}</div>
        <div class="notif-item-desc">${escapeHtml(n.body || n.comment || '')}</div>
      </div>
    `;
  }).join('');
}

function getRatingStarsSvg(rating, starFillColor) {
  const r = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= r;
    starsHtml += `
      <svg class="notif-star-svg" viewBox="0 0 24 24" fill="${isFilled ? (starFillColor || 'currentColor') : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    `;
  }
  return `<div class="notif-stars-group">${starsHtml}</div>`;
}

function triggerTopRightNotification(notif) {
  const container = document.getElementById('topRightNotificationContainer');
  if (!container) return;

  const toastId = 'toast_' + Math.random().toString(36).substring(2, 9);
  const toastEl = document.createElement('div');
  toastEl.id = toastId;
  toastEl.className = 'admin-top-right-toast';

  let colorClass = 'notif-toast-blue';
  let tagLabel = 'ALERT';
  let title = escapeHtml(notif.title || 'Administrative Notification');
  let msg = escapeHtml(notif.body || '');
  let starStripHtml = '';
  let starColor = 'currentColor';

  if (notif.type === 'FEEDBACK') {
    const r = Number(notif.rating);
    if (r === 1 || r === 2) {
      // 1 or 2: Red
      colorClass = 'notif-toast-red';
      tagLabel = 'STUDENT RATING: 1-2 STARS (CRITICAL)';
      starColor = '#ffffff';
    } else if (r === 3) {
      // 3: White
      colorClass = 'notif-toast-white';
      tagLabel = 'STUDENT RATING: 3 STARS (NEUTRAL)';
      starColor = '#f59e0b';
    } else {
      // Remaining (4 or 5): Green
      colorClass = 'notif-toast-green';
      tagLabel = 'STUDENT RATING: 4-5 STARS (POSITIVE)';
      starColor = '#ffffff';
    }

    title = `Student Rated Redressal — ${r}/5 Stars`;
    starStripHtml = `
      <div class="notif-toast-rating-strip">
        ${getRatingStarsSvg(r, starColor)}
        <span style="font-weight:700; font-size:12px; margin-left:4px;">${r} out of 5</span>
      </div>
    `;
    if (notif.comment) {
      msg = `Grievance #${escapeHtml(notif.grievanceNo)}: "${escapeHtml(notif.comment)}"`;
    } else {
      msg = `Student submitted a ${r}-star satisfaction rating for Grievance #${escapeHtml(notif.grievanceNo)}.`;
    }
  } else if (notif.type === 'ESCALATION') {
    colorClass = 'notif-toast-escalation';
    tagLabel = 'SLA BREACH ESCALATION';
  } else if (notif.type === 'RESOLUTION') {
    colorClass = 'notif-toast-resolved';
    tagLabel = 'OFFICIAL RESOLUTION';
  }

  toastEl.classList.add(colorClass);

  toastEl.innerHTML = `
    <div class="notif-toast-topbar">
      <div class="notif-toast-meta">
        <span class="notif-tag">${tagLabel}</span>
        <span class="notif-time-ago">Just now</span>
      </div>
      <button type="button" class="notif-close-btn" onclick="dismissTopRightToast('${toastId}')" title="Dismiss">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="notif-toast-body">
      <div class="notif-toast-title">${title}</div>
      ${starStripHtml}
      <div class="notif-toast-msg">${msg}</div>
    </div>
    <div class="notif-toast-actions">
      ${notif.grievanceId ? `
        <button type="button" class="notif-action-btn" onclick="openCaseDossier('${notif.grievanceId}'); dismissTopRightToast('${toastId}');">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          <span>View Case Dossier</span>
        </button>
      ` : ''}
      <button type="button" class="notif-action-btn" onclick="dismissTopRightToast('${toastId}')" style="opacity:0.85;">
        <span>Dismiss</span>
      </button>
    </div>
  `;

  container.appendChild(toastEl);

  // Auto-dismiss after 8.5 seconds
  setTimeout(() => {
    dismissTopRightToast(toastId);
  }, 8500);
}
window.triggerTopRightNotification = triggerTopRightNotification;

function dismissTopRightToast(toastId) {
  const toast = document.getElementById(toastId);
  if (!toast) return;
  toast.classList.add('hiding');
  setTimeout(() => {
    if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
  }, 320);
}
window.dismissTopRightToast = dismissTopRightToast;

// Expose instant test trigger for developer and test automation
window.triggerTestFeedbackNotification = function(rating, comment, grievanceNo) {
  triggerTopRightNotification({
    type: 'FEEDBACK',
    rating: Number(rating),
    comment: comment || 'Student feedback verification test note.',
    grievanceNo: grievanceNo || 'GRV-2026-TEST',
    timestamp: new Date().toISOString()
  });
};

function showToast(text) {
  triggerTopRightNotification({
    type: 'ACKNOWLEDGEMENT',
    title: 'System Notice',
    body: text
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// =====================================================================
// LIVE UNIVERSITY WHATSAPP DISPATCH PUSH NOTIFICATION ENGINE (ADMIN)
// =====================================================================
function playWhatsAppChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880, now + 0.08); // A5

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc1.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.38);
  } catch (e) {}
}

function showWhatsAppPush({ title, sender, message, actionText, actionCallback, timeout = 9500 }) {
  const container = document.getElementById('whatsappPushContainer');
  if (!container) return;

  playWhatsAppChime();

  const card = document.createElement('div');
  card.className = 'whatsapp-push-card';
  card.setAttribute('role', 'alert');

  card.innerHTML = `
    <div class="whatsapp-push-topbar">
      <div class="whatsapp-push-brand">
        <div class="whatsapp-push-icon" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z"/></svg>
        </div>
        <div class="whatsapp-push-title-wrap">
          <span class="whatsapp-push-app">WHATSAPP</span>
          <span class="whatsapp-push-dot">•</span>
          <span class="whatsapp-push-sender">${escapeHtml(sender || 'Vignan Grievance Cell')}</span>
          <span class="whatsapp-verified-badge" title="Verified University Official Channel">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          </span>
        </div>
      </div>
      <div class="whatsapp-push-meta">
        <span class="whatsapp-push-time">Just now</span>
        <button type="button" class="whatsapp-push-close" title="Dismiss notification" aria-label="Dismiss">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
    <div class="whatsapp-push-body">${formatWhatsAppPushText(message)}</div>
    ${actionText ? `
      <div class="whatsapp-push-actions">
        <button type="button" class="btn-push-action" id="btnPushActionAdmin">
          <span>${escapeHtml(actionText)}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
        <button type="button" class="btn-push-dismiss" id="btnPushDismissAdmin">Dismiss</button>
      </div>
    ` : ''}
  `;

  // Clear existing notifications
  container.innerHTML = '';
  container.appendChild(card);

  const dismiss = () => {
    card.classList.add('dismissing');
    setTimeout(() => {
      if (card.parentElement) card.parentElement.removeChild(card);
    }, 280);
  };

  const closeBtn = card.querySelector('.whatsapp-push-close');
  if (closeBtn) closeBtn.addEventListener('click', dismiss);

  const dismissBtn = card.querySelector('#btnPushDismissAdmin');
  if (dismissBtn) dismissBtn.addEventListener('click', dismiss);

  const actionBtn = card.querySelector('#btnPushActionAdmin');
  if (actionBtn && actionCallback) {
    actionBtn.addEventListener('click', () => {
      dismiss();
      actionCallback();
    });
  }

  let autoDismiss = setTimeout(dismiss, timeout);

  card.addEventListener('mouseenter', () => clearTimeout(autoDismiss));
  card.addEventListener('mouseleave', () => {
    autoDismiss = setTimeout(dismiss, 3500);
  });
}
window.showWhatsAppPush = showWhatsAppPush;

function formatWhatsAppPushText(txt) {
  if (!txt) return '';
  return txt
    .replace(/\*([^\*]+)\*/g, '<strong>$1</strong>')
    .replace(/\_([^\_]+)\_/g, '<em>$1</em>');
}

function renderWhatsAppTranscript(g, isAdmin = false) {
  if (!g) return '';
  const studentName = g.complainant_name || g.student_name || 'Student';
  const grievanceNo = g.grievance_no || 'GRV-2026';
  const roleName = typeof formatAdminAuthorityName === 'function' ? formatAdminAuthorityName(g.assigned_to_role) : (g.assigned_to_role || 'Department Authority');
  const catName = typeof formatAdminCategoryName === 'function' ? formatAdminCategoryName(g.category) : (g.category || 'General');

  const submittedDate = g.submitted_at ? new Date(g.submitted_at) : new Date();
  const timeStr1 = submittedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = submittedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  const isResolved = g.status === 'RESOLVED' || g.status === 'CLOSED' || Boolean(g.resolution);
  const resolvedDate = g.resolved_at ? new Date(g.resolved_at) : new Date();
  const timeStr2 = resolvedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const hasRating = Boolean(g.satisfaction_rating);

  const doubleTicksSvg = `
    <span class="whatsapp-ticks" title="Delivered and Read">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.41 11.93l-1.41 1.41 5.66 5.66 12-12-1.42-1.41zM.41 13.34l5.66 5.66 1.41-1.41-5.66-5.66-1.41 1.41z"/>
      </svg>
    </span>
  `;

  const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'https://vignan-student-grievance-agent.onrender.com';
  const trackLink = `${origin}/?ref=${encodeURIComponent(grievanceNo)}`;
  const rateLink = `${origin}/?ref=${encodeURIComponent(grievanceNo)}&action=rate`;

  let messagesHtml = '';

  // Message 1: Intake Notification Bubble
  messagesHtml += `
    <div class="whatsapp-bubble sent">
      <div class="whatsapp-bubble-sender">
        <span>Vignan Grievance Cell (Official ✓)</span>
      </div>
      <div class="whatsapp-bubble-text">Dear <strong>${escapeHtml(studentName)}</strong>, your grievance [<strong>${escapeHtml(grievanceNo)}</strong>] has been officially registered and assigned to <strong>${escapeHtml(roleName)}</strong>.

• Category: ${catName}
• Expected Resolution: 48h (Statutory SLA)
• Track live: <a href="${trackLink}" target="_blank" style="color:#0369a1;text-decoration:underline;font-weight:600;word-break:break-all;">${trackLink}</a></div>
      <div class="whatsapp-bubble-footer">
        <span>${timeStr1}</span>
        ${doubleTicksSvg}
      </div>
    </div>
  `;

  // Message 2: If Statutory / Emergency Route
  if (g.is_statutory_route || g.category === 'ANTI_RAGGING') {
    messagesHtml += `
      <div class="whatsapp-bubble sent" style="border-left: 3.5px solid #d62828;">
        <div class="whatsapp-bubble-sender" style="color: #d62828;">
          <span>Vignan Anti-Ragging &amp; ICC Emergency SOS</span>
        </div>
        <div class="whatsapp-bubble-text"><strong>EMERGENCY STATUTORY DISPATCH:</strong>
This grievance has triggered statutory Anti-Ragging &amp; Proctorial safety protocols. Rapid Action Safety Squad has been alerted for on-campus verification.</div>
        <div class="whatsapp-bubble-footer">
          <span>${timeStr1}</span>
          ${doubleTicksSvg}
        </div>
      </div>
    `;
  }

  // Message 3: When Case is Resolved
  if (isResolved) {
    const findingsSnippet = g.resolution || 'Official grievance redressal inquiry completed and corrective actions implemented by the department.';
    messagesHtml += `
      <div class="whatsapp-bubble sent">
        <div class="whatsapp-bubble-sender">
          <span>Vignan University Redressal Order (Official ✓)</span>
        </div>
        <div class="whatsapp-bubble-text">Dear <strong>${escapeHtml(studentName)}</strong>, your grievance [<strong>${escapeHtml(grievanceNo)}</strong>] has been formally <strong>RESOLVED</strong>.

• Official Findings: "${escapeHtml(findingsSnippet)}"
• Rate Your Satisfaction &amp; Feedback: <a href="${rateLink}" target="_blank" style="color:#0369a1;text-decoration:underline;font-weight:600;word-break:break-all;">${rateLink}</a>

Please click the link above to submit your 5-star satisfaction rating &amp; feedback:</div>
        <button type="button" class="whatsapp-bubble-action-btn" onclick="openResolutionLetterModal('${escapeHtml(grievanceNo)}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          <span>View University Redressal Order</span>
        </button>
        <div class="whatsapp-bubble-footer">
          <span>${timeStr2}</span>
          ${doubleTicksSvg}
        </div>
      </div>
    `;
  }

  // Message 4: If Student Submitted Feedback
  if (hasRating) {
    messagesHtml += `
      <div class="whatsapp-bubble received">
        <div class="whatsapp-bubble-sender" style="color: #0369a1;">
          <span>${escapeHtml(studentName)} (Student Feedback)</span>
        </div>
        <div class="whatsapp-bubble-text">Redressal Satisfaction Feedback:
★ <strong>${g.satisfaction_rating} / 5 Stars</strong>
${g.satisfaction_comment ? `\n"${escapeHtml(g.satisfaction_comment)}"` : ''}</div>
        <div class="whatsapp-bubble-footer">
          <span>${timeStr2}</span>
        </div>
      </div>

      <div class="whatsapp-bubble sent">
        <div class="whatsapp-bubble-sender">
          <span>Vignan Grievance Cell (Official ✓)</span>
        </div>
        <div class="whatsapp-bubble-text">Thank you for confirming. Grievance <strong>${escapeHtml(grievanceNo)}</strong> has been formally updated to <strong>CLOSED</strong> in the university grievance registry.</div>
        <div class="whatsapp-bubble-footer">
          <span>${timeStr2}</span>
          ${doubleTicksSvg}
        </div>
      </div>
    `;
  }

  return `
    <div class="whatsapp-chat-transcript" aria-label="Official WhatsApp Transcript">
      <div class="whatsapp-chat-topbar">
        <div class="whatsapp-chat-profile">
          <div class="whatsapp-chat-avatar" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#075e54"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
          </div>
          <div class="whatsapp-chat-title-box">
            <div class="whatsapp-chat-name">
              <span>Vignan Grievance Cell</span>
              <span class="whatsapp-verified-badge" title="Verified University Official Channel" style="display:inline-flex;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </span>
            </div>
            <div class="whatsapp-chat-status">Official Institutional Channel • Automated Delivery</div>
          </div>
        </div>
        <div class="whatsapp-chat-encrypted-pill">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <span>End-to-end Encrypted</span>
        </div>
      </div>
      <div class="whatsapp-date-divider">${dateStr}</div>
      ${messagesHtml}
    </div>
  `;
}
window.renderWhatsAppTranscript = renderWhatsAppTranscript;


