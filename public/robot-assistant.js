// =====================================================================
// Agent 46 — Robot Assistant Interactive Widget
// Floating AI Agent in Right-Down Corner with Knowledge & Navigation Help
// Zero-Emoji Compliance — Vignan University — Agentic AI Day 2026
// =====================================================================

(function () {
  'use strict';

  // Knowledge Base about Agent 46
  const AGENT_KNOWLEDGE = {
    overview: {
      title: 'Agent 46 — Student Grievance Redressal Agent',
      content: 'Agent 46 provides an institutional, transparent, and trackable grievance channel with strict SLA resolution timelines. It eliminates informal complaint black-holes where student issues disappear, ensuring every single grievance is logged, classified, routed, and resolved with formal documentation.',
      actions: [
        { label: 'File Grievance Now', action: 'goSubmit' },
        { label: 'Track Existing Case', action: 'goTrack' }
      ]
    },
    categories: {
      title: '10 Statutory & Departmental Grievance Categories',
      content: 'Agent 46 automatically classifies complaints into 10 structured categories:\n' +
        '1. Academic (Syllabus, grading, attendance, scheduling)\n' +
        '2. Examination & Evaluation (Paper review, hall tickets, re-evaluation)\n' +
        '3. Fee & Financial (Scholarships, excess charges, fee dues)\n' +
        '4. Hostel & Accommodation (Maintenance, room allocation, mess food quality)\n' +
        '5. Transport (Bus routes, fleet timings, pass issues)\n' +
        '6. Infrastructure & Facilities (Labs, Wi-Fi, classrooms, library)\n' +
        '7. Faculty Conduct (Teaching grievances, behavioral issues)\n' +
        '8. Harassment (POSH compliance, gender harassment - Routed to ICC)\n' +
        '9. Discrimination (Caste, religion, regional bias - Routed to EOC)\n' +
        '10. Ragging (Zero-tolerance statutory breach - Routed to Anti-Ragging Cell)',
      actions: [
        { label: 'Open Grievance Form', action: 'goSubmit' }
      ]
    },
    sla: {
      title: 'Service Level Agreement (SLA) & Escalation Hierarchy',
      content: 'Every grievance has a non-negotiable resolution timeline based on severity:\n' +
        '• CRITICAL (Ragging, acute safety): 24 Hours SLA\n' +
        '• HIGH (Harassment, discrimination): 48 Hours SLA\n' +
        '• MEDIUM (Academic, fees, hostel): 7 Days (168 Hours) SLA\n' +
        '• LOW (General infrastructure, transport): 15 Days (360 Hours) SLA\n\n' +
        'Automatic Escalation Protocol:\n' +
        'At 75% elapsed SLA: Priority Warning dispatch.\n' +
        'At 100% breach: Immediate automatic escalation to Dean of Student Affairs.\n' +
        'Post-breach non-resolution: Escalation directly to the Vice-Chancellor with committee summons.',
      actions: [
        { label: 'Check Live System Stats', action: 'getStats' }
      ]
    },
    anonymous: {
      title: 'Confidential & Anonymous Whistleblower Protection',
      content: 'For sensitive matters (ragging, harassment, faculty misconduct), students can toggle Anonymous Mode.\n' +
        '• No student name, roll number, or phone number is collected or stored.\n' +
        '• The system generates a cryptographic 6-character confidential Tracking PIN.\n' +
        '• Only the student with the PIN can check status and read official orders.\n' +
        '• Administrative authorities cannot inspect IP addresses or identity metadata.',
      actions: [
        { label: 'Enable Anonymous Mode in Form', action: 'enableAnonymous' }
      ]
    },
    orders: {
      title: 'Official University Resolution Orders',
      content: 'When an authority resolves a grievance, Agent 46 generates a formal legal Resolution Letter (University Order).\n' +
        '• Contains official Order Number (e.g. VU/GRC/ORD/2026/...)\n' +
        '• Embossed with Vignan University Institutional Seal\n' +
        '• Cites findings of fact, evidence examined, and corrective directives\n' +
        '• Features verified digital sign-off from authorized Dean or Committee Chair\n' +
        '• Students can download and print official PDF/order copy directly from the case dossier.',
      actions: [
        { label: 'Track Case to View Order', action: 'goTrack' }
      ]
    },
    authorities: {
      title: 'Authorized Oversight & Redressal Committees',
      content: 'Grievances are routed according to institutional mandates:\n' +
        '• Department Heads (HoD): Department-specific academic, lab, and faculty matters.\n' +
        '• Anti-Ragging Committee: Statutory squad headed by Prof. K. Rama Rao.\n' +
        '• Internal Complaints Committee (ICC): Women and POSH cell chaired by Dr. M. Sridevi.\n' +
        '• Equal Opportunity Cell: Anti-discrimination authority chaired by Dr. P. Balamurugan.\n' +
        '• Dean of Student Affairs: Central university-wide appellate authority.',
      actions: [
        { label: 'Officer Sign-In Portal', action: 'goOfficerLogin' }
      ]
    },
    tracking: {
      title: 'How to Track a Submitted Grievance',
      content: 'You can check your grievance progress at any time:\n' +
        '1. Click on the "Track My Grievances" tab above.\n' +
        '2. Enter your Grievance Tracking ID (e.g. GRV-2026-XXXXX) or your Roll Number.\n' +
        '3. If filed anonymously, enter your 6-character Confidential PIN.\n' +
        '4. View the real-time timeline, assigned authority, remaining SLA, and official resolution order.',
      actions: [
        { label: 'Go to Tracking Tab', action: 'goTrack' }
      ]
    },
    precedents: {
      title: 'AI Precedent Analysis & Case Consistency',
      content: 'Agent 46 leverages historical grievance resolutions to eliminate arbitrary decision-making.\n' +
        '• When an authority opens a case, the system retrieves top 3 historically similar resolved cases.\n' +
        '• Displays similarity score (e.g. 96% match), past corrective actions taken, and average time to resolve.\n' +
        '• Recommends institutional standard directives based on past approved orders.',
      actions: [
        { label: 'Learn More in Admin Console', action: 'goOfficerLogin' }
      ]
    },
    integrations: {
      title: 'Inter-Agent Ecosystem Integrations',
      content: 'Agent 46 communicates seamlessly with peer campus agents:\n' +
        '• Agent 64 (Intake Digitisation): Digitises physical paper complaints submitted at drop-boxes.\n' +
        '• Agent 47 (Student Wellbeing): Auto-initiates confidential counseling support for distress grievances.\n' +
        '• Agent 48 (Campus Safety): Dispatches immediate on-ground response for high-risk safety alerts.\n' +
        '• Agent 51 (Faculty Affairs): Coordinates faculty conduct inquiries under academic senate rules.',
      actions: [
        { label: 'File Grievance', action: 'goSubmit' }
      ]
    }
  };

  // Robot Assistant Widget Controller
  class RobotAssistant {
    constructor() {
      this.isOpen = false;
      this.hasGreeted = false;
      this.initUI();
      this.bindEvents();
    }

    initUI() {
      // 1. Container
      const container = document.createElement('div');
      container.className = 'robot-agent-container';
      container.id = 'robotAgentContainer';

      // 2. Greeting Speech Bubble
      const bubble = document.createElement('div');
      bubble.className = 'robot-speech-bubble';
      bubble.id = 'robotSpeechBubble';
      bubble.innerHTML = `
        <div class="robot-bubble-title">
          <span>Agent 46 AI Assistant</span>
          <button class="robot-bubble-close" id="closeBubbleBtn" title="Dismiss">&times;</button>
        </div>
        <div class="robot-bubble-text">
          Hi! I am your Grievance Robot Guide. Ask me anything about filing complaints, SLAs, authorities, or policies!
        </div>
        <div class="robot-bubble-action">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          Click to start chat
        </div>
      `;

      // 3. Robot Trigger & Avatar
      const triggerWrapper = document.createElement('div');
      triggerWrapper.className = 'robot-trigger-wrapper';
      triggerWrapper.id = 'robotTrigger';
      triggerWrapper.title = 'Click to open Agent 46 AI Assistant';

      triggerWrapper.innerHTML = `
        <img src="/assets/images/robot-agent-idle.png" alt="Agent 46 Robot Assistant" class="robot-avatar-img" id="robotAvatarImg">
        <div class="robot-shadow-ellipse"></div>
        <div class="robot-status-beacon" title="Assistant Online"></div>
      `;

      container.appendChild(bubble);
      container.appendChild(triggerWrapper);
      document.body.appendChild(container);

      // 4. Assistant Chat Dialog Window
      const dialog = document.createElement('div');
      dialog.className = 'robot-dialog hidden';
      dialog.id = 'robotDialog';

      dialog.innerHTML = `
        <div class="robot-dialog-header">
          <div class="robot-dialog-brand">
            <div class="robot-dialog-avatar">
              <img src="/assets/images/robot-agent-wave.png" alt="Robot Icon">
            </div>
            <div class="robot-dialog-title">
              <h3>Agent 46 Smart Assistant</h3>
              <div class="robot-status-tag">
                <span class="robot-status-dot"></span>
                <span>Online · Institutional Guide</span>
              </div>
            </div>
          </div>
          <div class="robot-dialog-actions">
            <button class="robot-header-btn" id="robotClearBtn" title="Clear Chat History">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
            </button>
            <button class="robot-header-btn" id="robotCloseBtn" title="Close Assistant">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div class="robot-quick-topics" id="robotQuickTopics">
          <button class="robot-topic-chip" data-topic="overview">What is Agent 46?</button>
          <button class="robot-topic-chip" data-topic="categories">Categories & Types</button>
          <button class="robot-topic-chip" data-topic="sla">SLA & Escalation</button>
          <button class="robot-topic-chip" data-topic="anonymous">Anonymous Mode</button>
          <button class="robot-topic-chip" data-topic="tracking">How to Track Case</button>
          <button class="robot-topic-chip" data-topic="orders">Resolution Orders</button>
          <button class="robot-topic-chip" data-topic="authorities">Who are Authorities?</button>
          <button class="robot-topic-chip" data-topic="precedents">AI Precedents</button>
          <button class="robot-topic-chip" data-topic="stats">Live System Stats</button>
        </div>

        <div class="robot-messages" id="robotMessages">
          <div class="robot-msg agent">
            <div class="robot-msg-bubble">
              <strong>Welcome to Vignan University Grievance Portal!</strong><br>
              I am your Agent 46 Robot Assistant. I can answer questions about the grievance lifecycle, categories, SLA escalation timelines, anonymous whistleblower protection, and official university orders.
              <div class="robot-action-btn-group">
                <button class="robot-action-btn" data-action="goSubmit">File a Grievance</button>
                <button class="robot-action-btn" data-action="goTrack">Track Existing Case</button>
                <button class="robot-action-btn" data-topic="sla">View SLA Timelines</button>
              </div>
            </div>
            <span class="robot-msg-time">Just now</span>
          </div>
        </div>

        <div class="robot-input-area">
          <input type="text" class="robot-input-field" id="robotInput" placeholder="Ask about filing, SLAs, categories, authorities..." autocomplete="off">
          <button class="robot-send-btn" id="robotSendBtn" title="Send message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      `;

      document.body.appendChild(dialog);
    }

    bindEvents() {
      const bubble = document.getElementById('robotSpeechBubble');
      const trigger = document.getElementById('robotTrigger');
      const dialog = document.getElementById('robotDialog');
      const closeBtn = document.getElementById('robotCloseBtn');
      const closeBubbleBtn = document.getElementById('closeBubbleBtn');
      const clearBtn = document.getElementById('robotClearBtn');
      const sendBtn = document.getElementById('robotSendBtn');
      const input = document.getElementById('robotInput');
      const avatar = document.getElementById('robotAvatarImg');
      const topics = document.getElementById('robotQuickTopics');
      const messagesContainer = document.getElementById('robotMessages');

      // Waving state on hover
      if (trigger && avatar) {
        trigger.addEventListener('mouseenter', () => {
          avatar.src = '/assets/images/robot-agent-wave.png';
        });
        trigger.addEventListener('mouseleave', () => {
          avatar.src = '/assets/images/robot-agent-idle.png';
        });
      }

      // Open/Toggle dialog
      if (trigger) {
        trigger.addEventListener('click', () => {
          this.toggleDialog();
        });
      }

      if (bubble) {
        bubble.addEventListener('click', (e) => {
          if (e.target.id === 'closeBubbleBtn' || e.target.closest('#closeBubbleBtn')) {
            bubble.style.display = 'none';
            return;
          }
          this.openDialog();
        });
      }

      if (closeBubbleBtn) {
        closeBubbleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          bubble.style.display = 'none';
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.closeDialog();
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.clearChat();
        });
      }

      // Send on enter or click
      if (sendBtn && input) {
        sendBtn.addEventListener('click', () => {
          this.handleUserSubmit();
        });

        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            this.handleUserSubmit();
          }
        });
      }

      // Topic chips
      if (topics) {
        topics.addEventListener('click', (e) => {
          const chip = e.target.closest('.robot-topic-chip');
          if (!chip) return;
          const topicKey = chip.getAttribute('data-topic');
          if (topicKey) {
            this.answerTopic(topicKey);
          }
        });
      }

      // Delegate message action buttons
      if (messagesContainer) {
        messagesContainer.addEventListener('click', (e) => {
          const actionBtn = e.target.closest('.robot-action-btn');
          if (!actionBtn) return;

          const action = actionBtn.getAttribute('data-action');
          const topic = actionBtn.getAttribute('data-topic');

          if (action) {
            this.executeAction(action);
          } else if (topic) {
            this.answerTopic(topic);
          }
        });
      }
    }

    openDialog() {
      const dialog = document.getElementById('robotDialog');
      const bubble = document.getElementById('robotSpeechBubble');
      const input = document.getElementById('robotInput');
      if (dialog) {
        dialog.classList.remove('hidden');
        this.isOpen = true;
        if (bubble) bubble.style.display = 'none';
        if (input) setTimeout(() => input.focus(), 150);
      }
    }

    closeDialog() {
      const dialog = document.getElementById('robotDialog');
      if (dialog) {
        dialog.classList.add('hidden');
        this.isOpen = false;
      }
    }

    toggleDialog() {
      if (this.isOpen) {
        this.closeDialog();
      } else {
        this.openDialog();
      }
    }

    clearChat() {
      const messagesContainer = document.getElementById('robotMessages');
      if (!messagesContainer) return;
      messagesContainer.innerHTML = `
        <div class="robot-msg agent">
          <div class="robot-msg-bubble">
            Chat cleared. How can I assist you with Vignan University's Grievance Redressal System?
            <div class="robot-action-btn-group">
              <button class="robot-action-btn" data-topic="overview">What is Agent 46?</button>
              <button class="robot-action-btn" data-topic="categories">Categories</button>
              <button class="robot-action-btn" data-topic="sla">SLA Protocol</button>
            </div>
          </div>
          <span class="robot-msg-time">Just now</span>
        </div>
      `;
    }

    handleUserSubmit() {
      const input = document.getElementById('robotInput');
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;

      input.value = '';
      this.addUserMessage(text);
      this.showTypingIndicator();

      setTimeout(() => {
        this.removeTypingIndicator();
        this.respondToQuery(text);
      }, 400);
    }

    addUserMessage(text) {
      const container = document.getElementById('robotMessages');
      if (!container) return;

      const msgDiv = document.createElement('div');
      msgDiv.className = 'robot-msg user';
      msgDiv.innerHTML = `
        <div class="robot-msg-bubble">${this.escapeHtml(text)}</div>
        <span class="robot-msg-time">${this.getTimeString()}</span>
      `;
      container.appendChild(msgDiv);
      this.scrollToBottom();
    }

    addAgentMessage(htmlContent, actions = []) {
      const container = document.getElementById('robotMessages');
      if (!container) return;

      let actionsHtml = '';
      if (actions && actions.length > 0) {
        actionsHtml = `<div class="robot-action-btn-group">` +
          actions.map(a => `<button class="robot-action-btn" data-action="${a.action}">${a.label}</button>`).join('') +
          `</div>`;
      }

      const msgDiv = document.createElement('div');
      msgDiv.className = 'robot-msg agent';
      msgDiv.innerHTML = `
        <div class="robot-msg-bubble">
          ${htmlContent}
          ${actionsHtml}
        </div>
        <span class="robot-msg-time">${this.getTimeString()}</span>
      `;
      container.appendChild(msgDiv);
      this.scrollToBottom();
    }

    showTypingIndicator() {
      const container = document.getElementById('robotMessages');
      if (!container) return;

      const indicator = document.createElement('div');
      indicator.id = 'robotTyping';
      indicator.className = 'robot-msg agent';
      indicator.innerHTML = `
        <div class="robot-typing-indicator">
          <div class="robot-typing-dot"></div>
          <div class="robot-typing-dot"></div>
          <div class="robot-typing-dot"></div>
        </div>
      `;
      container.appendChild(indicator);
      this.scrollToBottom();
    }

    removeTypingIndicator() {
      const indicator = document.getElementById('robotTyping');
      if (indicator) indicator.remove();
    }

    answerTopic(topicKey) {
      const topic = AGENT_KNOWLEDGE[topicKey];
      if (!topic) {
        if (topicKey === 'stats') {
          this.fetchLiveStats();
        }
        return;
      }

      const formatted = `<strong>${topic.title}</strong><br><br>${topic.content.replace(/\n/g, '<br>')}`;
      this.addAgentMessage(formatted, topic.actions);
    }

    respondToQuery(query) {
      const q = query.toLowerCase();

      // Check intent matches
      if (q.includes('what is') || q.includes('who are you') || q.includes('purpose') || q.includes('about agent')) {
        this.answerTopic('overview');
      } else if (q.includes('sla') || q.includes('timeline') || q.includes('how long') || q.includes('escalat') || q.includes('deadline') || q.includes('time')) {
        this.answerTopic('sla');
      } else if (q.includes('category') || q.includes('categories') || q.includes('ragging') || q.includes('harass') || q.includes('fee') || q.includes('hostel') || q.includes('academic')) {
        this.answerTopic('categories');
      } else if (q.includes('anonymous') || q.includes('whistleblower') || q.includes('confidential') || q.includes('pin') || q.includes('secret')) {
        this.answerTopic('anonymous');
      } else if (q.includes('track') || q.includes('status') || q.includes('check my') || q.includes('where is my')) {
        this.answerTopic('tracking');
      } else if (q.includes('order') || q.includes('letter') || q.includes('resolution document') || q.includes('formal order') || q.includes('pdf')) {
        this.answerTopic('orders');
      } else if (q.includes('authority') || q.includes('hod') || q.includes('dean') || q.includes('committee') || q.includes('who solves')) {
        this.answerTopic('authorities');
      } else if (q.includes('precedent') || q.includes('similar') || q.includes('past cases') || q.includes('history')) {
        this.answerTopic('precedents');
      } else if (q.includes('integrate') || q.includes('agent 64') || q.includes('agent 47') || q.includes('agent 48')) {
        this.answerTopic('integrations');
      } else if (q.includes('stat') || q.includes('count') || q.includes('total') || q.includes('how many')) {
        this.fetchLiveStats();
      } else if (q.includes('file') || q.includes('submit') || q.includes('complaint') || q.includes('new grievance')) {
        this.addAgentMessage(
          '<strong>Filing a Grievance:</strong><br>' +
          'You can submit a grievance directly using the online intake form on this page. Choose whether you want to provide your details or toggle <em>Anonymous Mode</em> for total privacy. After submitting, you will receive a unique tracking reference.',
          [
            { label: 'Open Grievance Form', action: 'goSubmit' },
            { label: 'Enable Anonymous Mode', action: 'enableAnonymous' }
          ]
        );
      } else if (q.includes('login') || q.includes('officer') || q.includes('sign in') || q.includes('admin')) {
        this.addAgentMessage(
          '<strong>Authority Oversight Console:</strong><br>' +
          'Institutional authorities (HoDs, Deans, and Committee Members) can sign in to inspect scoped dossiers, view AI precedent matches, record official directives, and generate official university orders.',
          [
            { label: 'Go to Officer Sign-In', action: 'goOfficerLogin' }
          ]
        );
      } else {
        // Intelligent fallback with recommendations
        this.addAgentMessage(
          `I am trained on all policies, statutory workflows, and SLAs for <strong>Agent 46</strong>.<br><br>` +
          `Here are key topics I can explain:`,
          [
            { label: 'SLA Timelines', action: 'topic_sla' },
            { label: 'Grievance Categories', action: 'topic_categories' },
            { label: 'Anonymous Whistleblower', action: 'topic_anonymous' },
            { label: 'Official Orders', action: 'topic_orders' },
            { label: 'Live Stats', action: 'getStats' }
          ]
        );
      }
    }

    async fetchLiveStats() {
      try {
        const res = await fetch('/api/analytics/dashboard');
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();
        const stats = data.overview || data;

        const total = stats.totalCases ?? stats.total ?? '--';
        const resolved = stats.resolvedCases ?? stats.resolved ?? '--';
        const avgHours = stats.avgResolutionHours ?? stats.avgTime ?? '--';
        const slaRate = stats.slaComplianceRate ? stats.slaComplianceRate + '%' : '--';

        this.addAgentMessage(
          `<strong>Live Agent 46 System Status:</strong><br>` +
          `<div class="robot-knowledge-card">` +
          `<div class="robot-knowledge-title">Central Grievance Redressal Metrics:</div>` +
          `<ul class="robot-knowledge-list">` +
          `<li><strong>Total Registered Grievances:</strong> ${total}</li>` +
          `<li><strong>Successfully Resolved:</strong> ${resolved}</li>` +
          `<li><strong>Average Resolution Time:</strong> ${avgHours} Hours</li>` +
          `<li><strong>SLA Compliance Adherence:</strong> ${slaRate}</li>` +
          `<li><strong>Active SLA Watchdog:</strong> Online (Background Cron Every 5m)</li>` +
          `</ul>` +
          `</div>`,
          [
            { label: 'File Grievance Now', action: 'goSubmit' },
            { label: 'Track Existing Case', action: 'goTrack' }
          ]
        );
      } catch (err) {
        this.addAgentMessage(
          '<strong>System Status:</strong><br>' +
          'Agent 46 SLA Engine is currently ACTIVE on the campus network. Grievances are continuously monitored with automatic 75% warnings and 100% statutory escalation to Deans.',
          [
            { label: 'SLA Protocols', action: 'topic_sla' }
          ]
        );
      }
    }

    executeAction(action) {
      if (action === 'goSubmit') {
        const tabBtn = document.querySelector('[data-tab="submit"]');
        if (tabBtn) tabBtn.click();
        const intakeCard = document.getElementById('intakeCard') || document.getElementById('grievanceForm');
        if (intakeCard) {
          intakeCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        this.closeDialog();
      } else if (action === 'goTrack') {
        const tabBtn = document.querySelector('[data-tab="track"]');
        if (tabBtn) tabBtn.click();
        const trackInput = document.getElementById('trackId') || document.getElementById('trackerInput');
        if (trackInput) {
          trackInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          trackInput.focus();
        }
        this.closeDialog();
      } else if (action === 'enableAnonymous') {
        const tabBtn = document.querySelector('[data-tab="submit"]');
        if (tabBtn) tabBtn.click();
        const anonToggle = document.getElementById('anonToggle');
        if (anonToggle && !anonToggle.checked) {
          anonToggle.click();
        }
        const intakeCard = document.getElementById('intakeCard') || document.getElementById('grievanceForm');
        if (intakeCard) {
          intakeCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        this.closeDialog();
      } else if (action === 'goOfficerLogin') {
        window.location.href = '/login.html?portal=authority';
      } else if (action === 'getStats') {
        this.fetchLiveStats();
      } else if (action.startsWith('topic_')) {
        const key = action.replace('topic_', '');
        this.answerTopic(key);
      }
    }

    scrollToBottom() {
      const container = document.getElementById('robotMessages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }

    escapeHtml(str) {
      return (str || '').replace(/[&<>"']/g, function (m) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[m];
      });
    }

    getTimeString() {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  // Initialize on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.agent46Robot = new RobotAssistant();
    });
  } else {
    window.agent46Robot = new RobotAssistant();
  }
})();
