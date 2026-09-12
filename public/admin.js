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
  // Auto-refresh every 60 seconds
  setInterval(loadDashboard, 60000);
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

    html += `
      <tr onclick="openCaseDossier('${escapeHtml(c.grievance_no)}')" title="Click to view full case details">
        <td><strong style="color:var(--primary); font-family:monospace; font-size:12.5px;">${escapeHtml(c.grievance_no)}</strong></td>
        <td>${complainantHtml}</td>
        <td><span class="problem-snippet" title="${escapeHtml(c.description)}">${escapeHtml(c.description)}</span></td>
        <td>${escapeHtml(formatAdminCategoryName(c.category))}</td>
        <td><span class="table-badge ${sevClass}">${escapeHtml(c.severity || 'NORMAL')}</span></td>
        <td><span class="table-badge" style="background:#e0f2fe; color:#0369a1;">${escapeHtml(c.status || 'RECEIVED')}</span></td>
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
      let ratingHtml = '';
      if (d.satisfaction_rating) {
        let starsSvg = '';
        for (let i = 1; i <= 5; i++) {
          const filled = i <= d.satisfaction_rating;
          starsSvg += `<svg width="13" height="13" viewBox="0 0 24 24" fill="${filled ? '#eab308' : 'none'}" stroke="${filled ? '#eab308' : '#cbd5e1'}" stroke-width="2" style="margin-right:1px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
        }
        ratingHtml = `<span style="display:inline-flex; align-items:center; gap:4px; font-weight:700; color:#a16207;">Student Score: ${d.satisfaction_rating}/5 ${starsSvg}</span>`;
      }
      resContent.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="font-size:13px; color:var(--text-primary); line-height:1.5; background:#f0fdf4; border-left:3.5px solid #16a34a; padding:10px 14px; border-radius:6px;">
            ${escapeHtml(d.resolution || 'Resolution recorded.')}
          </div>
          <div style="font-size:11.5px; color:var(--text-muted); display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px; align-items:center;">
            <span><strong>Resolved Date:</strong> ${d.resolved_at ? new Date(d.resolved_at).toLocaleString() : 'N/A'}</span>
            ${ratingHtml}
          </div>
          ${d.satisfaction_comment ? `<div style="font-size:12px; color:var(--text-secondary); font-style:italic; margin-top:2px;">"${escapeHtml(d.satisfaction_comment)}"</div>` : ''}
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

  btn.disabled = true;
  btn.innerHTML = `<svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg><span>Recording Resolution...</span>`;

  try {
    const caseIdentifier = activeDossierCase.grievance_no || activeDossierCase.grievance_id;
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

    // Re-open dossier to display the resolution view & updated audit trail
    await openCaseDossier(caseIdentifier);

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
// Toast helper
// ---------------------------------------------------------------
function showToast(text) {
  const toast = document.getElementById('toast');
  const content = document.getElementById('toastContent');
  if (!toast || !content) return;

  content.innerHTML = text.replace(/\n/g, '<br>');
  toast.style.display = 'block';

  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.style.display = 'none';
  }, 6000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
