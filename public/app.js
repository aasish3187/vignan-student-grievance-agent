// =====================================================================
// Student Portal JS — Agent 46: Streamlined No-Login Student Intake
// Direct Identity Capture & Private Multi-Channel Case Redressal
// Vignan University — Agentic AI Day 2026
// Strict Professional Standard — Zero Emojis, 100% Vector Geometry
// =====================================================================

const API = '';
const STATUTORY = ['HARASSMENT', 'RAGGING', 'DISCRIMINATION', 'SAFETY'];

// In-Memory Search Results for Private Tracking
let currentSearchedCases = [];
let currentSelectedRating = 0;

const RATING_LABELS = {
  1: '1 Star — Unsatisfactory redressal',
  2: '2 Stars — Poor experience',
  3: '3 Stars — Acceptable resolution',
  4: '4 Stars — Good and prompt resolution',
  5: '5 Stars — Outstanding and transparent resolution'
};

// Format authority role into institutional titles
function formatAuthorityName(role) {
  if (!role) return 'Pending Authority';
  if (role === 'HOD') return 'Departments HOD';
  if (role === 'GRIEVANCE_COMMITTEE' || role === 'GRIEVANCE_CELL' || role === 'DEAN_STUDENT_AFFAIRS') return 'Grievance Committee';
  if (role === 'ANTI_RAGGING_COMMITTEE' || role === 'ICC' || role === 'SAFETY_COMMITTEE') return 'Anti-Ragging & Student Comm.';
  return role.replace(/_/g, ' ');
}

// Format internal category code into clean pathway name
function formatCategoryName(cat) {
  if (!cat) return 'General Grievance';
  if (['ACADEMIC', 'EXAMINATION', 'FACULTY_CONDUCT'].includes(cat)) return 'Departments HOD';
  if (['OTHER', 'HOSTEL', 'TRANSPORT', 'INFRASTRUCTURE', 'FEE'].includes(cat)) return 'Grievance Committee';
  if (['RAGGING', 'HARASSMENT', 'DISCRIMINATION', 'SAFETY'].includes(cat)) return 'Anti-Ragging & Student Comm.';
  return cat.replace(/_/g, ' ');
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardStats();
  setupTabs();
  setupForm();

  // Check URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mode') === 'anonymous') {
    const anonToggle = document.getElementById('anonToggle');
    if (anonToggle) {
      anonToggle.checked = true;
      anonToggle.dispatchEvent(new Event('change'));
    }
  }
  if (urlParams.get('tab') === 'track') {
    const tabTrack = document.getElementById('tabTrack');
    if (tabTrack) tabTrack.click();
  }
});

// ===== DASHBOARD STATS =====
async function loadDashboardStats() {
  try {
    const res = await fetch(`${API}/api/analytics/dashboard`);
    const json = await res.json();
    if (json.success) {
      const d = json.data;
      animateCounter('statTotal', d.total);
      animateCounter('statResolved', d.resolved);
      animateCounter('statAvgTime', d.avgResolutionTimeHours, 1);
      const slaEl = document.getElementById('statSLA');
      if (slaEl) slaEl.textContent = d.slaComplianceRate + '%';
    }
  } catch (e) {
    console.error('Stats load failed:', e);
  }
}

function animateCounter(id, target, decimals = 0) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.max(target / 30, 1);
  const interval = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    el.textContent = decimals > 0 ? current.toFixed(decimals) : Math.round(current);
  }, 30);
}

// ===== TABS SETUP =====
function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panelId = tab.dataset.tab === 'submit' ? 'panelSubmit' : 'panelTrack';
      const targetPanel = document.getElementById(panelId);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });
}

// ===== FORM SETUP =====
function setupForm() {
  const anonToggle = document.getElementById('anonToggle');
  const anonNotice = document.getElementById('anonNotice');
  const studentIdentCard = document.getElementById('studentIdentCard');
  const nameInput = document.getElementById('complainantName');
  const regdInput = document.getElementById('complainantRegdNo');
  const phoneInput = document.getElementById('complainantPhone');

  // Toggle Anonymous Mode
  if (anonToggle) {
    anonToggle.addEventListener('change', () => {
      const isAnon = anonToggle.checked;
      if (studentIdentCard) {
        studentIdentCard.style.display = isAnon ? 'none' : 'block';
      }
      if (anonNotice) {
        anonNotice.style.display = isAnon ? 'block' : 'none';
      }

      // Update required attributes
      if (nameInput) nameInput.required = !isAnon;
      if (regdInput) regdInput.required = !isAnon;
      if (phoneInput) phoneInput.required = !isAnon;
    });
  }

  // Category -> Statutory Warning
  const catSelect = document.getElementById('category');
  const warning = document.getElementById('statutoryWarning');
  if (catSelect && warning) {
    catSelect.addEventListener('change', () => {
      if (STATUTORY.includes(catSelect.value)) {
        warning.classList.add('visible');
      } else {
        warning.classList.remove('visible');
      }
    });
  }

  // Custom Category & Department Dropdowns
  setupCustomCategorySelect();
  setupCustomDepartmentSelect();

  // Voice Dictation & Evidence Upload
  setupEvidenceUpload();
  setupVoiceDictation();

  // Character Counter
  const desc = document.getElementById('description');
  const charCount = document.getElementById('charCount');
  if (desc && charCount) {
    desc.addEventListener('input', () => {
      charCount.textContent = `${desc.value.length} / 5000`;
    });
  }

  // Submit Listener
  const form = document.getElementById('grievanceForm');
  if (form) {
    form.addEventListener('submit', submitGrievance);
  }
}

// ===== CUSTOM CATEGORY SELECT COMPONENT =====
function setupCustomCategorySelect() {
  const trigger = document.getElementById('customCategoryTrigger');
  const menu = document.getElementById('customCategoryMenu');
  const nativeSelect = document.getElementById('category');
  const triggerBadge = document.getElementById('triggerBadge');
  const triggerLabel = document.getElementById('triggerLabel');
  const wrapper = document.getElementById('customCategoryWrapper');

  if (!trigger || !menu || !nativeSelect || !wrapper) return;
  const options = menu.querySelectorAll('.custom-option');

  function openMenu() {
    const deptMenu = document.getElementById('customDepartmentMenu');
    const deptTrigger = document.getElementById('customDepartmentTrigger');
    const deptWrapper = document.getElementById('customDepartmentWrapper');
    if (deptMenu) deptMenu.classList.remove('open');
    if (deptTrigger) deptTrigger.setAttribute('aria-expanded', 'false');
    if (deptWrapper) deptWrapper.classList.remove('is-open');

    menu.classList.add('open');
    wrapper.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    menu.classList.remove('open');
    wrapper.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  options.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = opt.dataset.value;
      const title = opt.dataset.title;
      const badgeClass = opt.dataset.badge;
      const badgeSvg = opt.querySelector('.symbol-badge').innerHTML;

      nativeSelect.value = val;
      nativeSelect.dispatchEvent(new Event('change'));

      triggerLabel.textContent = title;
      triggerBadge.className = `symbol-badge ${badgeClass}`;
      triggerBadge.innerHTML = badgeSvg;

      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');

      closeMenu();
    });
  });

  nativeSelect.addEventListener('change', () => {
    const matchingOpt = menu.querySelector(`.custom-option[data-value="${nativeSelect.value}"]`);
    if (matchingOpt) {
      triggerLabel.textContent = matchingOpt.dataset.title;
      triggerBadge.className = `symbol-badge ${matchingOpt.dataset.badge}`;
      triggerBadge.innerHTML = matchingOpt.querySelector('.symbol-badge').innerHTML;
      options.forEach(o => o.classList.remove('selected'));
      matchingOpt.classList.add('selected');
    }
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

function resetCustomCategorySelect() {
  const triggerLabel = document.getElementById('triggerLabel');
  const triggerBadge = document.getElementById('triggerBadge');
  const menu = document.getElementById('customCategoryMenu');
  if (!triggerLabel || !triggerBadge || !menu) return;
  const options = menu.querySelectorAll('.custom-option');
  const firstOpt = menu.querySelector('.custom-option[data-value=""]');
  if (!firstOpt) return;

  triggerLabel.textContent = 'Auto-Detect Category with AI Classifier';
  triggerBadge.className = 'symbol-badge badge-ai';
  triggerBadge.innerHTML = firstOpt.querySelector('.symbol-badge').innerHTML;
  options.forEach(o => o.classList.remove('selected'));
  firstOpt.classList.add('selected');
}

// ===== CUSTOM DEPARTMENT SELECT COMPONENT =====
function setupCustomDepartmentSelect() {
  const trigger = document.getElementById('customDepartmentTrigger');
  const menu = document.getElementById('customDepartmentMenu');
  const nativeSelect = document.getElementById('department');
  const triggerBadge = document.getElementById('triggerDeptBadge');
  const triggerLabel = document.getElementById('triggerDeptLabel');
  const wrapper = document.getElementById('customDepartmentWrapper');

  if (!trigger || !menu || !nativeSelect || !wrapper) return;
  const options = menu.querySelectorAll('.custom-option');

  function openMenu() {
    const catMenu = document.getElementById('customCategoryMenu');
    const catTrigger = document.getElementById('customCategoryTrigger');
    const catWrapper = document.getElementById('customCategoryWrapper');
    if (catMenu) catMenu.classList.remove('open');
    if (catTrigger) catTrigger.setAttribute('aria-expanded', 'false');
    if (catWrapper) catWrapper.classList.remove('is-open');

    menu.classList.add('open');
    wrapper.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    menu.classList.remove('open');
    wrapper.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  options.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = opt.dataset.value;
      const title = opt.dataset.title;
      const badgeClass = opt.dataset.badge;
      const badgeSvg = opt.querySelector('.symbol-badge').innerHTML;

      nativeSelect.value = val;
      nativeSelect.dispatchEvent(new Event('change'));

      triggerLabel.textContent = title;
      triggerBadge.className = `symbol-badge ${badgeClass}`;
      triggerBadge.innerHTML = badgeSvg;

      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');

      closeMenu();
    });
  });

  nativeSelect.addEventListener('change', () => {
    const matchingOpt = menu.querySelector(`.custom-option[data-value="${nativeSelect.value}"]`);
    if (matchingOpt) {
      triggerLabel.textContent = matchingOpt.dataset.title;
      triggerBadge.className = `symbol-badge ${matchingOpt.dataset.badge}`;
      triggerBadge.innerHTML = matchingOpt.querySelector('.symbol-badge').innerHTML;
      options.forEach(o => o.classList.remove('selected'));
      matchingOpt.classList.add('selected');
    }
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

function resetCustomDepartmentSelect() {
  const triggerLabel = document.getElementById('triggerDeptLabel');
  const triggerBadge = document.getElementById('triggerDeptBadge');
  const menu = document.getElementById('customDepartmentMenu');
  if (!triggerLabel || !triggerBadge || !menu) return;
  const options = menu.querySelectorAll('.custom-option');
  const firstOpt = menu.querySelector('.custom-option[data-value=""]');
  if (!firstOpt) return;

  triggerLabel.textContent = '— Select Department —';
  triggerBadge.className = 'symbol-badge badge-slate';
  triggerBadge.innerHTML = firstOpt.querySelector('.symbol-badge').innerHTML;
  options.forEach(o => o.classList.remove('selected'));
  firstOpt.classList.add('selected');
}

// ===== SUBMIT GRIEVANCE (STREAMLINED INTAKE) =====
async function submitGrievance(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  btn.querySelector('.btn-text').style.display = 'none';
  btn.querySelector('.btn-loading').style.display = 'inline';
  btn.disabled = true;

  const isAnon = Boolean(document.getElementById('anonToggle')?.checked);
  let name = null;
  let regdNo = null;
  let phone = null;

  if (!isAnon) {
    name = (document.getElementById('complainantName')?.value || '').trim();
    regdNo = (document.getElementById('complainantRegdNo')?.value || '').trim().toUpperCase();
    phone = (document.getElementById('complainantPhone')?.value || '').trim();

    if (!name || !regdNo || !phone) {
      alert('Please fill out your Full Name, Registration Number, and Mobile Number. Alternatively, switch to Anonymous Mode.');
      btn.querySelector('.btn-text').style.display = 'inline';
      btn.querySelector('.btn-loading').style.display = 'none';
      btn.disabled = false;
      return;
    }

    const cleanPhoneDigits = phone.replace(/\D/g, '');
    if (cleanPhoneDigits.length < 10) {
      alert('Please enter a valid 10-digit mobile phone number.');
      btn.querySelector('.btn-text').style.display = 'inline';
      btn.querySelector('.btn-loading').style.display = 'none';
      btn.disabled = false;
      return;
    }
  }

  const body = {
    description: document.getElementById('description').value.trim(),
    category: document.getElementById('category').value || undefined,
    department_id: document.getElementById('department').value || undefined,
    is_anonymous: isAnon,
    complainant_name: isAnon ? null : name,
    complainant_regd_no: isAnon ? null : regdNo,
    complainant_phone: isAnon ? null : phone,
    attachment_name: currentAttachment ? currentAttachment.name : null,
    attachment_type: currentAttachment ? currentAttachment.type : null,
    attachment_data: currentAttachment ? currentAttachment.data : null,
    _vignan_hp_check: document.getElementById('vignanHpCheck')?.value || ''
  };

  try {
    const res = await fetch(`${API}/api/grievances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = await res.json();
    if (json.success) {
      showSuccess(json.data, { name, regdNo, phone, isAnon });
      loadDashboardStats();
    } else {
      alert('Error: ' + (json.messages?.join(', ') || json.message || 'Submission failed'));
    }
  } catch (err) {
    alert('Network error: ' + err.message);
  } finally {
    btn.querySelector('.btn-text').style.display = 'inline';
    btn.querySelector('.btn-loading').style.display = 'none';
    btn.disabled = false;
  }
}

function showSuccess(data, info) {
  document.getElementById('grievanceForm').style.display = 'none';
  const card = document.getElementById('successCard');
  card.style.display = 'block';

  const details = document.getElementById('successDetails');
  const isStatutory = data.classification?.isStatutoryRoute;

  let intakeSummaryHtml = '';
  if (data.anonymousPin) {
    intakeSummaryHtml = `
      <div class="secret-pin-box">
        <div class="secret-pin-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <span>CONFIDENTIAL ANONYMOUS TRACKING PIN</span>
        </div>
        <p class="secret-pin-inst">Save this 6-digit PIN along with Reference No <strong>${data.grievanceNo}</strong>. Because this grievance is zero-knowledge protected, this PIN is required to track status updates and submit satisfaction feedback.</p>
        <div class="secret-pin-display">
          <span class="secret-pin-digits" id="secretPinDigits">${data.anonymousPin}</span>
          <button type="button" class="btn-copy-pin" onclick="copyTrackingPin('${data.anonymousPin}', this)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copy PIN</span>
          </button>
        </div>
      </div>
    `;
  } else {
    intakeSummaryHtml = `
      <div class="verified-success-box">
        <div class="verified-success-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <span>Registered for Student: <strong>${escapeHtml(info.name)}</strong> (${escapeHtml(info.regdNo)})</span>
        </div>
        <p class="verified-success-sub">Mobile: <strong>${escapeHtml(info.phone)}</strong>. You can securely track this grievance anytime in the <strong>Track My Grievances</strong> tab using your Registration Number and Mobile Number.</p>
      </div>
    `;
  }

  details.innerHTML = `
    ${intakeSummaryHtml}
    <div class="success-detail-row">
      <span class="label">Reference No.</span>
      <span class="value">${data.grievanceNo}</span>
    </div>
    <div class="success-detail-row">
      <span class="label">Category</span>
      <span class="value">${data.classification?.category || 'N/A'}</span>
    </div>
    <div class="success-detail-row">
      <span class="label">Severity</span>
      <span class="value">${data.classification?.severity || 'NORMAL'}</span>
    </div>
    <div class="success-detail-row">
      <span class="label">Assigned To</span>
      <span class="value">${data.routing?.description || 'N/A'}</span>
    </div>
    <div class="success-detail-row">
      <span class="label">SLA Deadline</span>
      <span class="value">${data.slaDueAt ? new Date(data.slaDueAt).toLocaleString() : 'N/A'}</span>
    </div>
    <div class="success-detail-row">
      <span class="label">Confidence</span>
      <span class="value">${((data.classification?.confidence || 0) * 100).toFixed(1)}%</span>
    </div>
    ${currentAttachment ? `
    <div class="success-detail-row">
      <span class="label">Evidence File</span>
      <span class="value">${escapeHtml(currentAttachment.name)} (Encrypted & Attached)</span>
    </div>` : ''}
    ${!info.isAnon && info.phone ? `
    <div class="success-detail-row" style="background:#f0fdf4;margin:8px -8px 0;padding:10px 8px;border-radius:6px;border:1px solid #bbf7d0;">
      <span class="label" style="color:#15803d;display:flex;align-items:center;gap:6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
        Instant Dispatch
      </span>
      <span class="value" style="color:#15803d;font-weight:600;">WhatsApp acknowledgment dispatched to +91 ${escapeHtml(info.phone.slice(-10))}</span>
    </div>` : ''}
    ${isStatutory ? `
    <div class="success-detail-row" style="background:#fde8e8;margin:8px -8px -8px;padding:12px 8px;border-radius:0 0 8px 8px;">
      <span class="label" style="color:#d62828;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:-2px;margin-right:4px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        Statutory Route
      </span>
      <span class="value" style="color:#d62828;">Direct committee route — Anti-Ragging / ICC Emergency SOS Dispatched</span>
    </div>` : ''}
  `;
}

function resetForm() {
  document.getElementById('grievanceForm').style.display = 'block';
  document.getElementById('successCard').style.display = 'none';
  document.getElementById('grievanceForm').reset();
  resetCustomCategorySelect();
  resetCustomDepartmentSelect();
  clearAttachment();
  if (typeof stopVoiceRecording === 'function') stopVoiceRecording();

  const anonToggle = document.getElementById('anonToggle');
  if (anonToggle) {
    anonToggle.checked = false;
    anonToggle.dispatchEvent(new Event('change'));
  }

  const statWarn = document.getElementById('statutoryWarning');
  if (statWarn) statWarn.classList.remove('visible');
  const charCount = document.getElementById('charCount');
  if (charCount) charCount.textContent = '0 / 5000';
}

// ===== EVIDENCE UPLOAD & DRAG-AND-DROP =====
let currentAttachment = null;

function setupEvidenceUpload() {
  const dropzone = document.getElementById('evidenceDropzone');
  const fileInput = document.getElementById('evidenceFileInput');
  const previewCard = document.getElementById('evidencePreviewCard');
  const prompt = document.getElementById('dropzonePrompt');
  const btnRemove = document.getElementById('btnRemoveEvidence');
  const filenameEl = document.getElementById('previewFilename');
  const filesizeEl = document.getElementById('previewFilesize');
  const mediaContainer = document.getElementById('previewMediaContainer');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', (e) => {
    if (e.target.closest('#btnRemoveEvidence')) return;
    fileInput.click();
  });

  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      processSelectedFile(fileInput.files[0]);
    }
  });

  if (btnRemove) {
    btnRemove.addEventListener('click', (e) => {
      e.stopPropagation();
      clearAttachment();
    });
  }

  function processSelectedFile(file) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxBytes = 5 * 1024 * 1024; // 5MB

    if (!allowed.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
      alert('Invalid file format. Please attach a photo (.jpg, .png, .webp) or document (.pdf).');
      return;
    }

    if (file.size > maxBytes) {
      alert('File exceeds 5MB limit. Please upload a smaller compressed file or screenshot.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(evt) {
      const base64Data = evt.target.result;
      currentAttachment = {
        name: file.name,
        type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        data: base64Data,
        size: file.size
      };

      if (filenameEl) filenameEl.textContent = file.name;
      if (filesizeEl) filesizeEl.textContent = formatBytes(file.size);

      if (mediaContainer) {
        if (currentAttachment.type.startsWith('image/')) {
          mediaContainer.innerHTML = `<img src="${base64Data}" alt="Evidence thumbnail">`;
        } else {
          mediaContainer.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>`;
        }
      }

      if (prompt) prompt.style.display = 'none';
      if (previewCard) previewCard.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}

function clearAttachment() {
  currentAttachment = null;
  const fileInput = document.getElementById('evidenceFileInput');
  if (fileInput) fileInput.value = '';
  const prompt = document.getElementById('dropzonePrompt');
  const previewCard = document.getElementById('evidencePreviewCard');
  if (prompt) prompt.style.display = 'flex';
  if (previewCard) previewCard.style.display = 'none';
}

// ===== VERNACULAR VOICE DICTATION (TELUGU & ENGLISH) =====
let currentVoiceLang = 'en-IN';
let speechRecognizer = null;
let isRecordingVoice = false;

function stopVoiceRecording() {
  isRecordingVoice = false;
  if (speechRecognizer) {
    try { speechRecognizer.stop(); } catch(e) {}
    speechRecognizer = null;
  }
  const btnVoice = document.getElementById('btnVoiceInput');
  const micLabel = document.getElementById('micStatusText');
  const banner = document.getElementById('voiceStatusBanner');
  if (btnVoice) btnVoice.classList.remove('recording');
  if (micLabel) micLabel.textContent = 'Voice Dictation';
  if (banner) banner.style.display = 'none';
}

function setupVoiceDictation() {
  const btnVoice = document.getElementById('btnVoiceInput');
  const banner = document.getElementById('voiceStatusBanner');
  const statusMsg = document.getElementById('voiceStatusMsg');
  const micLabel = document.getElementById('micStatusText');
  const langEn = document.getElementById('langEnBtn');
  const langTe = document.getElementById('langTeBtn');
  const desc = document.getElementById('description');

  if (!btnVoice || !desc) return;

  if (langEn && langTe) {
    langEn.addEventListener('click', () => {
      langEn.classList.add('active');
      langTe.classList.remove('active');
      currentVoiceLang = 'en-IN';
      if (isRecordingVoice) {
        stopVoiceRecording();
        startVoiceRecording();
      }
    });

    langTe.addEventListener('click', () => {
      langTe.classList.add('active');
      langEn.classList.remove('active');
      currentVoiceLang = 'te-IN';
      if (isRecordingVoice) {
        stopVoiceRecording();
        startVoiceRecording();
      }
    });
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    btnVoice.title = 'Speech recognition not supported in this browser. Please type directly.';
    btnVoice.style.opacity = '0.7';
    btnVoice.addEventListener('click', () => {
      alert('Voice dictation is supported natively in Google Chrome, Microsoft Edge, and modern Chromium browsers.');
    });
    return;
  }

  btnVoice.addEventListener('click', () => {
    if (isRecordingVoice) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  });

  function startVoiceRecording() {
    try {
      speechRecognizer = new SpeechRecognition();
      speechRecognizer.continuous = true;
      speechRecognizer.interimResults = true;
      speechRecognizer.lang = currentVoiceLang;

      speechRecognizer.onstart = () => {
        isRecordingVoice = true;
        btnVoice.classList.add('recording');
        if (micLabel) micLabel.textContent = 'Stop Dictation';
        if (banner) {
          banner.style.display = 'flex';
          statusMsg.textContent = `Listening in ${currentVoiceLang === 'te-IN' ? 'Telugu (తెలుగు)' : 'English'}... Speak clearly now.`;
        }
      };

      speechRecognizer.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          const currentText = desc.value;
          desc.value = currentText ? `${currentText.trim()} ${finalTranscript.trim()}` : finalTranscript.trim();
          desc.dispatchEvent(new Event('input'));
        }
      };

      speechRecognizer.onerror = (event) => {
        console.warn('Voice dictation error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access blocked. Please grant microphone permissions in your browser.');
        }
        stopVoiceRecording();
      };

      speechRecognizer.onend = () => {
        if (isRecordingVoice) {
          try {
            speechRecognizer.start();
          } catch(e) {
            stopVoiceRecording();
          }
        }
      };

      speechRecognizer.start();
    } catch(err) {
      console.error('Failed to start speech recognition:', err);
      stopVoiceRecording();
    }
  }
}

// ===== PRIVATE STUDENT TRACKER (REGD NO + PHONE) =====
async function searchStudentGrievances(e) {
  if (e) e.preventDefault();

  const regdInput = document.getElementById('searchRegdNo');
  const phoneInput = document.getElementById('searchPhone');
  const alertEl = document.getElementById('studentTrackAlert');
  const btn = document.getElementById('btnStudentTrack');
  const list = document.getElementById('grievanceList');
  const headerContainer = document.getElementById('trackHeaderContainer');
  const titleEl = document.getElementById('trackHeaderTitle');
  const subEl = document.getElementById('trackHeaderSub');

  const regdNo = (regdInput ? regdInput.value : '').trim().toUpperCase();
  const phone = (phoneInput ? phoneInput.value : '').trim();

  if (!regdNo || !phone) {
    if (alertEl) {
      alertEl.className = 'tracker-alert alert-error';
      alertEl.textContent = 'Please enter both your Registration Number and Registered Mobile Number.';
      alertEl.style.display = 'block';
    }
    return;
  }

  if (alertEl) alertEl.style.display = 'none';
  if (btn) {
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Searching Records...';
  }

  try {
    const res = await fetch(`${API}/api/grievances/track-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regd_no: regdNo, phone })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to search student grievance records.');
    }

    currentSearchedCases = json.data || [];

    if (headerContainer) headerContainer.style.display = 'flex';
    if (titleEl) titleEl.textContent = `My Verified Grievances (${regdNo})`;
    if (subEl) {
      subEl.textContent = `Showing ${currentSearchedCases.length} case(s) found in university database`;
      subEl.style.display = 'block';
    }

    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) filterStatus.value = '';

    renderSearchedCases(currentSearchedCases, regdNo);

    if (alertEl) {
      alertEl.className = 'tracker-alert alert-success';
      alertEl.textContent = `Verified: ${currentSearchedCases.length} grievance(s) retrieved for ${regdNo}.`;
      alertEl.style.display = 'block';
      setTimeout(() => { alertEl.style.display = 'none'; }, 2500);
    }

  } catch (err) {
    if (alertEl) {
      alertEl.className = 'tracker-alert alert-error';
      alertEl.textContent = err.message;
      alertEl.style.display = 'block';
    }
    if (list) {
      list.innerHTML = `
        <div class="empty-state">
          <p style="font-weight:600; color:#dc2626; margin-bottom:4px;">Lookup Error</p>
          <p style="font-size:13px; color:#64748b;">${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Search My Grievances';
    }
  }
}
window.searchStudentGrievances = searchStudentGrievances;

function filterSearchedCases() {
  const status = document.getElementById('filterStatus')?.value;
  let filtered = currentSearchedCases;
  if (status) {
    filtered = currentSearchedCases.filter(g => g.status === status);
  }
  const regdNo = document.getElementById('searchRegdNo')?.value || '';
  renderSearchedCases(filtered, regdNo);
}
window.filterSearchedCases = filterSearchedCases;

function renderSearchedCases(cases, regdNo) {
  const list = document.getElementById('grievanceList');
  if (!list) return;

  if (!cases || cases.length === 0) {
    list.innerHTML = `
      <div style="text-align:center; padding:36px 16px; background:#f8fafc; border:1.5px dashed #cbd5e1; border-radius:10px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" style="margin-bottom:10px;">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <p style="font-weight:700; color:#334155; margin-bottom:4px; font-size:15px;">No grievances found matching this query</p>
        <p style="font-size:12.5px; color:#64748b; max-width:440px; margin:0 auto;">
          No cases were located for Registration Number <strong>${escapeHtml(regdNo || '')}</strong>. Please check your credentials or lodge a complaint in the "Submit Grievance" tab.
        </p>
      </div>
    `;
    return;
  }

  const pendingFeedbackCases = cases.filter(c => c.status === 'RESOLVED' && !c.satisfaction_rating);
  let bannerHtml = '';
  if (pendingFeedbackCases.length > 0) {
    bannerHtml = `
      <div class="pending-feedback-banner">
        <div class="pending-feedback-banner-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <div class="pending-feedback-banner-text">
          <div class="pending-feedback-title">Action Required: Case Resolved — Mandatory Feedback (${pendingFeedbackCases.length})</div>
          <div class="pending-feedback-desc">Authority has officially completed redressal for ${pendingFeedbackCases.map(c => c.grievance_no).join(', ')}. Under institutional regulations, student satisfaction feedback is mandatory to finalize official case closure. Click on the case below to submit your rating.</div>
        </div>
      </div>
    `;
  }

  list.innerHTML = bannerHtml + cases.map(g => {
    let cardClass = 'grievance-card';
    if (g.is_statutory_route) cardClass += ' statutory';
    else if (g.status === 'ESCALATED') cardClass += ' escalated';
    else if (['RESOLVED', 'CLOSED'].includes(g.status)) cardClass += ' resolved';

    const isFeedbackPending = g.status === 'RESOLVED' && !g.satisfaction_rating;
    const isClosedWithFeedback = g.status === 'CLOSED' || Boolean(g.satisfaction_rating);

    let badgeText = g.status.replace('_', ' ');
    let badgeClass = `badge-${(g.status || 'received').toLowerCase()}`;
    if (isFeedbackPending) {
      badgeText = 'FEEDBACK REQUIRED';
      badgeClass = 'badge-feedback-required';
      cardClass += ' card-pending-feedback';
    } else if (isClosedWithFeedback) {
      badgeText = 'CLOSED';
      badgeClass = 'badge-closed-verified';
    }

    return `
      <div class="${cardClass}" onclick="showDetail('${g.grievance_id}')">
        <div class="card-top">
          <span class="card-ref">${g.grievance_no}</span>
          <span class="card-badge ${badgeClass}">${badgeText}</span>
        </div>
        <p class="card-desc">${escapeHtml(g.description)}</p>
        <div class="card-meta">
          <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:3px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>${formatCategoryName(g.category)}</span>
          <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:3px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${new Date(g.submitted_at).toLocaleDateString()}</span>
          <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:3px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${formatAuthorityName(g.assigned_to_role)}</span>
          ${g.is_statutory_route ? '<span style="color:#d62828;font-weight:600;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:3px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Statutory</span>' : ''}
          ${g.satisfaction_rating ? `<span><svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="none" style="vertical-align:-1px;margin-right:3px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>${g.satisfaction_rating}/5</span>` : ''}
        </div>
        ${isFeedbackPending ? `
          <div class="card-mandatory-action-strip">
            <span class="pulse-dot"></span>
            <span>Action Required: Rate Redressal to Finalize Closure &rarr;</span>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// ===== ANONYMOUS PIN CASE LOOKUP =====
async function handleAnonymousTrack(e) {
  e.preventDefault();
  const refNoInput = document.getElementById('anonRefNo');
  const pinInput = document.getElementById('anonPin');
  const alertEl = document.getElementById('anonTrackAlert');
  const btn = document.getElementById('btnTrackPin');

  const refNo = refNoInput ? refNoInput.value.trim().toUpperCase() : '';
  const pin = pinInput ? pinInput.value.trim() : '';

  if (!refNo || !pin) {
    if (alertEl) {
      alertEl.className = 'tracker-alert alert-error';
      alertEl.textContent = 'Please enter both the Grievance Reference Number and the 6-digit Secret PIN.';
      alertEl.style.display = 'block';
    }
    return;
  }

  if (alertEl) alertEl.style.display = 'none';
  if (btn) {
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Verifying PIN...';
  }

  try {
    const res = await fetch(`${API}/api/grievances/track-anonymous`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grievance_no: refNo, pin })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Case lookup failed. Please verify credentials.');
    }

    renderDetailModalWithData(json.data);

    if (alertEl) {
      alertEl.className = 'tracker-alert alert-success';
      alertEl.textContent = 'Cryptographic PIN verified. Displaying confidential case dossier.';
      alertEl.style.display = 'block';
      setTimeout(() => { alertEl.style.display = 'none'; }, 2500);
    }
  } catch (err) {
    if (alertEl) {
      alertEl.className = 'tracker-alert alert-error';
      alertEl.textContent = err.message;
      alertEl.style.display = 'block';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Lookup Case';
    }
  }
}
window.handleAnonymousTrack = handleAnonymousTrack;

// ===== DETAIL MODAL =====
async function showDetail(id) {
  try {
    const res = await fetch(`${API}/api/grievances/${encodeURIComponent(id)}`);
    const json = await res.json();
    if (!json.success) return;

    renderDetailModalWithData(json.data);
  } catch (err) {
    alert('Failed to load case details: ' + err.message);
  }
}
window.showDetail = showDetail;

function renderDetailModalWithData(g) {
  currentSelectedRating = 0;
  const modal = document.getElementById('modalOverlay');
  const titleEl = document.getElementById('modalTitle');
  if (titleEl) titleEl.textContent = g.grievance_no;

  const body = document.getElementById('modalBody');
  const studentName = g.complainant_name || g.student_name;
  const studentRoll = g.complainant_regd_no || g.student_regd_no || g.student_username;
  const studentPhone = g.complainant_phone || g.student_phone;
  const isFeedbackPending = g.status === 'RESOLVED' && !g.satisfaction_rating;

  body.innerHTML = `
    ${isFeedbackPending ? `
      <div class="mandatory-feedback-modal-banner">
        <div class="mandatory-feedback-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <div class="mandatory-feedback-text">
          <div class="mandatory-feedback-heading">Action Required: Official Redressal Completed — Mandatory Student Feedback</div>
          <div class="mandatory-feedback-body">The institutional authority has completed official redressal for this case. Under University Redressal Regulations, the complainant must rate the redressal experience and provide remarks below to formally close this case.</div>
        </div>
      </div>
    ` : ''}

    <div class="detail-grid">
      <div class="detail-item"><div class="label">Grievance Pathway</div><div class="value">${formatCategoryName(g.category)}</div></div>
      <div class="detail-item"><div class="label">Severity</div><div class="value">${g.severity}</div></div>
      <div class="detail-item"><div class="label">Status</div><div class="value">${isFeedbackPending ? '<span style="color:#b45309;font-weight:700;">RESOLVED (Feedback Pending)</span>' : (g.status === 'CLOSED' || g.satisfaction_rating ? '<span style="color:#15803d;font-weight:700;">CLOSED (Verified)</span>' : g.status)}</div></div>
      <div class="detail-item"><div class="label">Assigned Authority</div><div class="value">${formatAuthorityName(g.assigned_to_role)}</div></div>
      <div class="detail-item"><div class="label">Submitted</div><div class="value">${new Date(g.submitted_at).toLocaleString()}</div></div>
      <div class="detail-item"><div class="label">SLA Deadline</div><div class="value">${g.sla_due_at ? new Date(g.sla_due_at).toLocaleString() : 'N/A'}</div></div>
      ${g.is_anonymous ? '<div class="detail-item" style="grid-column:span 2;background:#e6f4ea;"><div class="label" style="display:flex;align-items:center;gap:4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Anonymous Mode</div><div class="value">Identity cryptographically decoupled at database layer</div></div>' : ''}
      ${!g.is_anonymous && (studentName || studentRoll) ? `<div class="detail-item" style="grid-column:span 2;background:#eff6ff;"><div class="label" style="color:#1e40af;display:flex;align-items:center;gap:4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>Complainant Student Information</div><div class="value" style="color:#1e3a8a;"><strong>${escapeHtml(studentName || 'Student')}</strong> (${escapeHtml(studentRoll || 'Verified')}) ${studentPhone ? `· Mobile: ${escapeHtml(studentPhone)}` : ''}</div></div>` : ''}
      ${g.is_statutory_route ? '<div class="detail-item" style="grid-column:span 2;background:#fde8e8;"><div class="label" style="color:#d62828;display:flex;align-items:center;gap:4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Statutory Protocol</div><div class="value" style="color:#d62828;">Direct committee handling — No AI processing</div></div>' : ''}
    </div>

    <p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px;padding:12px;background:var(--primary-light);border-radius:8px;">${escapeHtml(g.description)}</p>

    ${renderResolutionAndFeedbackSection(g)}

    <h4 style="font-size:15px;font-weight:700;color:var(--primary-dark);margin-bottom:12px;">Event Timeline</h4>
    <div class="timeline">
      ${(g.events || []).map(evt => {
        let evtClass = 'timeline-event';
        if (evt.event_type === 'ESCALATED') evtClass += ' event-escalated';
        else if (evt.event_type === 'RESOLVED') evtClass += ' event-resolved';
        else if (g.is_statutory_route && evt.event_type === 'ACKNOWLEDGED') evtClass += ' event-statutory';

        return `
          <div class="${evtClass}">
            <div class="timeline-type">${evt.event_type.replace('_', ' ')}</div>
            <div class="timeline-time">${new Date(evt.occurred_at).toLocaleString()}</div>
            ${evt.notes ? `<div class="timeline-notes">${escapeHtml(evt.notes)}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;

  modal.style.display = 'flex';

  if (isFeedbackPending) {
    setTimeout(() => {
      const card = document.getElementById('studentRatingCard');
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 250);
  }
}

function closeModal() {
  const modal = document.getElementById('modalOverlay');
  if (modal) modal.style.display = 'none';
}
window.closeModal = closeModal;

// Close modal on outside click or Escape
document.addEventListener('click', (e) => {
  if (e.target.id === 'modalOverlay') closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ===== RESOLUTION & FEEDBACK SECTION =====
function renderResolutionAndFeedbackSection(g) {
  const isResolved = g.status === 'RESOLVED' || g.status === 'CLOSED' || Boolean(g.resolution);
  if (!isResolved) return '';

  let html = `
    <div class="student-resolution-card">
      <div class="student-resolution-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <span>Official Redressal Resolution</span>
      </div>
      <div class="student-resolution-text">
        ${escapeHtml(g.resolution || 'Grievance has been officially resolved by the designated institutional authority.')}
      </div>
      <div class="student-resolution-footer">
        <div class="student-resolution-date">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span>Resolved: ${g.resolved_at ? new Date(g.resolved_at).toLocaleString() : 'Official Authority Order'}</span>
        </div>
        <button type="button" class="btn-resolution-letter" onclick="openResolutionLetterModal('${g.grievance_no}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          <span>View Official University Order</span>
        </button>
      </div>
    </div>
  `;

  if (g.satisfaction_rating) {
    html += `
      <div class="student-rating-saved">
        <div class="student-rating-saved-head">
          <div style="display:flex; align-items:center; gap:6px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span style="font-weight:700; color:#15803d; font-size:13.5px;">Student Redressal Feedback Verified</span>
          </div>
          <span class="badge-status-closed-tag">CASE OFFICIALLY CLOSED</span>
        </div>
        <div class="student-rating-saved-stars">
          ${renderStarsSvgDisplay(g.satisfaction_rating)}
          <strong style="margin-left:8px; color:#854d0e; font-size:13px;">${g.satisfaction_rating} / 5 Stars (${RATING_LABELS[g.satisfaction_rating] || 'Rated'})</strong>
        </div>
        ${g.satisfaction_comment ? `
          <div class="student-rating-saved-comment">
            "${escapeHtml(g.satisfaction_comment)}"
          </div>
        ` : ''}
      </div>
    `;
  } else {
    html += `
      <div class="student-rating-card mandatory-rating-card" id="studentRatingCard">
        <div class="student-rating-header">
          <div class="mandatory-badge-chip">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>MANDATORY STEP</span>
          </div>
          <span class="student-rating-title">Rate Redressal Experience & Confirm Closure</span>
        </div>
        <p class="student-rating-desc">
          Under VFSTR Grievance Redressal Regulations, case closure requires complainant feedback. Select a 1 to 5 star rating reflecting your redressal experience and optionally add remarks to finalize closure.
        </p>
        <div class="student-stars-row" id="studentStarsContainer">
          ${[1, 2, 3, 4, 5].map(starNum => `
            <button type="button" class="student-star-btn" data-star="${starNum}" onclick="selectStudentStar(${starNum})" onmouseenter="previewStudentStar(${starNum})" onmouseleave="resetStudentStarPreview()" title="${starNum} Stars — ${RATING_LABELS[starNum]}">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" id="studentStarSvg_${starNum}">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
          `).join('')}
        </div>
        <div class="student-rating-label" id="studentRatingLabel">Click a star to rate (1 to 5) — Mandatory</div>
        <textarea id="studentFeedbackComment" class="student-feedback-textarea" rows="2" placeholder="Please provide your feedback remarks or suggestions regarding the redressal process (optional)..."></textarea>
        <div id="studentFeedbackAlert" style="display:none;" class="tracker-alert"></div>
        <button type="button" class="btn-submit-feedback" id="btnSubmitFeedback" onclick="submitStudentFeedback('${g.grievance_id || g.grievance_no}')" disabled>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Submit Mandatory Rating & Close Case</span>
        </button>
      </div>
    `;
  }

  return html;
}

function renderStarsSvgDisplay(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    const filled = i <= rating;
    html += `<svg width="16" height="16" viewBox="0 0 24 24" fill="${filled ? '#eab308' : 'none'}" stroke="${filled ? '#eab308' : '#cbd5e1'}" stroke-width="2" style="margin-right:2px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
  }
  return html;
}

function previewStudentStar(num) {
  for (let i = 1; i <= 5; i++) {
    const svg = document.getElementById(`studentStarSvg_${i}`);
    if (!svg) continue;
    if (i <= num) {
      svg.setAttribute('fill', '#facc15');
      svg.setAttribute('stroke', '#eab308');
    } else {
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', '#cbd5e1');
    }
  }
  const label = document.getElementById('studentRatingLabel');
  if (label && RATING_LABELS[num]) {
    label.textContent = RATING_LABELS[num];
  }
}
window.previewStudentStar = previewStudentStar;

function resetStudentStarPreview() {
  renderStudentStarState(currentSelectedRating);
}
window.resetStudentStarPreview = resetStudentStarPreview;

function renderStudentStarState(num) {
  for (let i = 1; i <= 5; i++) {
    const svg = document.getElementById(`studentStarSvg_${i}`);
    if (!svg) continue;
    if (i <= num) {
      svg.setAttribute('fill', '#eab308');
      svg.setAttribute('stroke', '#ca8a04');
    } else {
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', '#cbd5e1');
    }
  }
  const label = document.getElementById('studentRatingLabel');
  if (label) {
    label.textContent = num > 0 ? RATING_LABELS[num] : 'Click a star to rate (1 to 5)';
  }
}

function selectStudentStar(num) {
  currentSelectedRating = num;
  renderStudentStarState(num);
  const btn = document.getElementById('btnSubmitFeedback');
  if (btn) btn.disabled = false;
}
window.selectStudentStar = selectStudentStar;

async function submitStudentFeedback(grievanceId) {
  const commentInput = document.getElementById('studentFeedbackComment');
  const alertEl = document.getElementById('studentFeedbackAlert');
  const btn = document.getElementById('btnSubmitFeedback');
  const comment = commentInput ? commentInput.value.trim() : '';

  if (!currentSelectedRating || currentSelectedRating < 1 || currentSelectedRating > 5) {
    if (alertEl) {
      alertEl.className = 'tracker-alert alert-error';
      alertEl.textContent = 'Please select a star rating between 1 and 5 to finalize case closure.';
      alertEl.style.display = 'block';
    } else {
      alert('Please select a star rating between 1 and 5.');
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg><span>Submitting Rating...</span>`;
  }

  try {
    const res = await fetch(`${API}/api/grievances/${encodeURIComponent(grievanceId)}/satisfaction`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: currentSelectedRating,
        comment: comment || undefined
      })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || json.error || 'Failed to submit feedback');
    }

    if (alertEl) {
      alertEl.className = 'tracker-alert alert-success';
      alertEl.textContent = 'Satisfaction feedback successfully verified! Case is now officially CLOSED.';
      alertEl.style.display = 'block';
    }

    // Refresh case details and searched cases list
    setTimeout(async () => {
      await showDetail(grievanceId);
      const regdNo = document.getElementById('searchRegdNo')?.value || '';
      const phone = document.getElementById('searchPhone')?.value || '';
      if (regdNo && phone) {
        searchStudentGrievances();
      }
      loadDashboardStats();
    }, 900);
  } catch (err) {
    console.error('Feedback error:', err);
    if (alertEl) {
      alertEl.className = 'tracker-alert alert-error';
      alertEl.textContent = 'Submission failed: ' + err.message;
      alertEl.style.display = 'block';
    }
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Submit Rating & Finalize Case</span>`;
    }
  }
}
window.submitStudentFeedback = submitStudentFeedback;

// ===== COPY TRACKING PIN =====
function copyTrackingPin(pin, btn) {
  navigator.clipboard.writeText(pin).then(() => {
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>`;
    setTimeout(() => {
      btn.innerHTML = origHtml;
    }, 1800);
  }).catch(() => {
    alert(`PIN: ${pin}`);
  });
}
window.copyTrackingPin = copyTrackingPin;

// ===== UTILITIES =====
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== OFFICIAL RESOLUTION ORDER MODAL =====
async function openResolutionLetterModal(grievanceNo) {
  const modal = document.getElementById('resolutionLetterModal');
  const paper = document.getElementById('resolutionLetterPaper');
  if (!modal || !paper) return;

  if (!grievanceNo) {
    alert('No active grievance selected for resolution letter.');
    return;
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  paper.innerHTML = '<p class="empty-state">Generating official university resolution order...</p>';

  try {
    const res = await fetch(`${API}/api/grievances/${encodeURIComponent(grievanceNo)}/resolution-letter`);
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
  const detailModal = document.getElementById('modalOverlay');
  if (!detailModal || detailModal.style.display === 'none') {
    document.body.style.overflow = '';
  }
}
window.closeResolutionLetterModal = closeResolutionLetterModal;

