document.addEventListener('DOMContentLoaded', async () => {
  const inboxContainer = document.getElementById('inboxContainer');
  const inboxDropdown = document.getElementById('inboxDropdown');
  const dropdownSelected = inboxDropdown.querySelector('.dropdown-selected');
  const dropdownList = inboxDropdown.querySelector('.dropdown-list');
  const addInboxButton = document.getElementById('addInboxButton');
  const copyEmailButton = document.getElementById('copyEmailButton');
  const startSignupButton = document.getElementById('startSignup');
  const refreshMessagesButton = document.getElementById('refreshMessages');
  const themeToggleButton = document.getElementById('themeToggle');
  const messagesListElement = document.getElementById('messagesList');
  const messageDetailElement = document.getElementById('messageDetail');
  const messageDetailContentElement = document.getElementById('messageDetailContent');
  const backButton = document.getElementById('backButton');
  const latestOtpContainer = document.getElementById('latestOtpContainer');
  const latestOtpCode = document.getElementById('latestOtpCode');
  const copyOtpButton = document.getElementById('copyOtpButton');
  const historyButton = document.getElementById('historyButton');
  const reportIssueButton = document.getElementById('reportIssue');
  const loginInfoButton = document.getElementById('loginInfoButton');
  const loginInfoSection = document.querySelector('.login-info-section');
  const savedLoginInfo = document.getElementById('savedLoginInfo');
  const exportDataButton = document.getElementById('exportData');
  const importDataButton = document.getElementById('importData');
  const searchMessagesInput = document.getElementById('searchMessages');
  const otpFilterCheckbox = document.getElementById('otpFilter');
  const analyticsButton = document.getElementById('analyticsButton');
  const analyticsSection = document.querySelector('.analytics-section');
  const analyticsDashboard = document.getElementById('analyticsDashboard');
  const notificationsToggle = document.getElementById('notificationsToggle');
  let loginInfoViewActive = false;
  let analyticsViewActive = false;

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  const historySection = document.querySelector('.history-section');
  const emailHistoryList = document.getElementById('emailHistoryList');
  let historyViewActive = false;

  let currentFilters = {
    searchQuery: '',
    hasOTP: false
  };

  // Initialize notifications toggle
  async function initializeNotifications() {
    try {
      const { notificationSettings = { enabled: true } } = await chrome.storage.local.get(['notificationSettings']);
      const notificationsToggle = document.getElementById('notificationsToggle');
      notificationsToggle.setAttribute('data-enabled', notificationSettings.enabled);
      updateNotificationIcon(notificationsToggle, notificationSettings.enabled);
      if (notificationSettings.enabled) {
        await requestNotificationPermission();
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      showToast('Failed to initialize notifications', true);
    }
  }

  // Request notification permission
  async function requestNotificationPermission() {
    if (!('Notification' in window)) {
      showToast('Notifications not supported in this browser', true);
      notificationsToggle.checked = false;
      await chrome.storage.local.set({ notificationSettings: { enabled: false } });
      return;
    }

    if (Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          notificationsToggle.checked = false;
          await chrome.storage.local.set({ notificationSettings: { enabled: false } });
          showToast('Notifications permission denied', true);
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        showToast('Failed to request notification permission', true);
      }
    } else if (Notification.permission === 'denied') {
      notificationsToggle.checked = false;
      await chrome.storage.local.set({ notificationSettings: { enabled: false } });
      showToast('Notifications permission denied', true);
    }
  }

  function updateNotificationIcon(button, enabled) {
    button.setAttribute('data-enabled', enabled);
    button.querySelector('.notification-enabled').style.display = enabled ? 'inline' : 'none';
    button.querySelector('.notification-disabled').style.display = enabled ? 'none' : 'inline';
  }
  
  // Handle notifications toggle
  notificationsToggle.addEventListener('click', async () => {
    const currentEnabled = notificationsToggle.getAttribute('data-enabled') === 'true';
    const enabled = !currentEnabled;
    try {
      await chrome.storage.local.set({ notificationSettings: { enabled } });
      updateNotificationIcon(notificationsToggle, enabled);
      if (enabled) {
        await requestNotificationPermission();
        if (Notification.permission !== 'granted') {
          updateNotificationIcon(notificationsToggle, false);
          await chrome.storage.local.set({ notificationSettings: { enabled: false } });
          showToast('Notifications permission denied', true);
          return;
        }
      }
      showToast(`Notifications ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      showToast('Failed to update notification settings', true);
      updateNotificationIcon(notificationsToggle, currentEnabled); // Revert icon
    }
  });

  loginInfoButton.addEventListener('click', () => {
    loginInfoViewActive = !loginInfoViewActive;
    
    if (loginInfoViewActive) {
      updateSavedLoginInfo();
      loginInfoSection.style.display = 'block';
      loginInfoSection.classList.add('fullscreen');
      historySection.style.display = 'none';
      analyticsSection.style.display = 'none';
      historyViewActive = false;
      analyticsViewActive = false;
      
      if (!document.getElementById('loginInfoBackButton')) {
        const backButton = document.createElement('button');
        backButton.id = 'loginInfoBackButton';
        backButton.className = 'back-button';
        backButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        `;
        backButton.addEventListener('click', () => {
          loginInfoViewActive = false;
          loginInfoSection.classList.remove('fullscreen');
          loginInfoSection.style.display = 'none';
          if (document.getElementById('loginInfoBackButton')) {
            document.getElementById('loginInfoBackButton').remove();
          }
        });
        loginInfoSection.insertBefore(backButton, loginInfoSection.firstChild);
      }
    } else {
      loginInfoSection.classList.remove('fullscreen');
      loginInfoSection.style.display = 'none';
      if (document.getElementById('loginInfoBackButton')) {
        document.getElementById('loginInfoBackButton').remove();
      }
    }
  });

  historyButton.addEventListener('click', () => {
    historyViewActive = !historyViewActive;
    
    if (historyViewActive) {
      updateEmailHistory();
      historySection.style.display = 'block';
      historySection.classList.add('fullscreen');
      loginInfoSection.style.display = 'none';
      analyticsSection.style.display = 'none';
      loginInfoViewActive = false;
      analyticsViewActive = false;
      
      if (!document.getElementById('historyBackButton')) {
        const backButton = document.createElement('button');
        backButton.id = 'historyBackButton';
        backButton.className = 'back-button';
        backButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        `;
        backButton.addEventListener('click', () => {
          historyViewActive = false;
          historySection.classList.remove('fullscreen');
          historySection.style.display = 'none';
          if (document.getElementById('historyBackButton')) {
            document.getElementById('historyBackButton').remove();
          }
        });
        historySection.insertBefore(backButton, historySection.firstChild);
      }
    } else {
      historySection.classList.remove('fullscreen');
      historySection.style.display = 'none';
      if (document.getElementById('historyBackButton')) {
        document.getElementById('historyBackButton').remove();
      }
    }
  });

  analyticsButton.addEventListener('click', () => {
    analyticsViewActive = !analyticsViewActive;
    
    if (analyticsViewActive) {
      updateAnalyticsDashboard();
      analyticsSection.style.display = 'block';
      analyticsSection.classList.add('fullscreen');
      loginInfoSection.style.display = 'none';
      historySection.style.display = 'none';
      loginInfoViewActive = false;
      historyViewActive = false;
      
      if (!document.getElementById('analyticsBackButton')) {
        const backButton = document.createElement('button');
        backButton.id = 'analyticsBackButton';
        backButton.className = 'back-button';
        backButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        `;
        backButton.addEventListener('click', () => {
          analyticsViewActive = false;
          analyticsSection.classList.remove('fullscreen');
          analyticsSection.style.display = 'none';
          if (document.getElementById('analyticsBackButton')) {
            document.getElementById('analyticsBackButton').remove();
          }
        });
        analyticsSection.insertBefore(backButton, analyticsSection.firstChild);
      }
    } else {
      analyticsSection.classList.remove('fullscreen');
      analyticsSection.style.display = 'none';
      if (document.getElementById('analyticsBackButton')) {
        document.getElementById('analyticsBackButton').remove();
      }
    }
  });

  reportIssueButton.addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://github.com/EveryWebStuffs/1Click-Autofill-with-Temp-Mail/issues/new'
    });
  });

  exportDataButton.addEventListener('click', async () => {
    const result = await window.dataManager.exportData();
    if (result.success) {
      showToast('Data exported successfully');
    } else {
      showToast('Failed to export data: ' + result.error, true);
    }
  });

  importDataButton.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await window.dataManager.importData(file);
      if (result.success) {
        showToast('Data imported successfully');
        updateEmailHistory();
        updateSavedLoginInfo();
        await initializeInboxes();
      } else {
        showToast('Failed to import data: ' + result.error, true);
      }
    } catch (error) {
      showToast('Error importing data: ' + error.message, true);
    } finally {
      fileInput.value = '';
    }
  });

  const initializeTheme = async () => {
    try {
      const { darkMode } = await chrome.storage.local.get(['darkMode']);
      if (darkMode === true) {
        document.body.classList.add('dark-mode');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error getting theme preference:', error);
      return false;
    }
  };

  let isDarkMode = await initializeTheme();

  themeToggleButton.addEventListener('click', async () => {
    isDarkMode = !isDarkMode;
    
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    try {
      await chrome.storage.local.set({ darkMode: isDarkMode });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  });

  function showToast(message, isError = false) {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : 'success'}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy: ', err);
      showToast('Failed to copy', true);
    }
  }

  copyOtpButton.addEventListener('click', () => {
    const otpText = latestOtpCode.textContent;
    if (otpText && otpText !== '------') {
      copyToClipboard(otpText);
    }
  });

  copyEmailButton.addEventListener('click', () => {
    const emailText = dropdownSelected.textContent;
    if (emailText && emailText !== 'Select an inbox') {
      copyToClipboard(emailText);
    }
  });

  function updateLatestOtp(otp) {
    if (otp) {
      latestOtpContainer.style.display = 'flex';
      latestOtpCode.textContent = otp;
    } else {
      latestOtpContainer.style.display = 'none';
      latestOtpCode.textContent = '------';
    }
  }

  function showMessageDetail(message) {
    const width = 800;
    const height = 600;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const messageWindow = window.open('', '_blank', `popup=yes,width=${width},height=${height},left=${left},top=${top},titlebar=no,frame=no,toolbar=no,menubar=no,location=no,status=no,resizable=no,chrome=no,dialog=yes`);
    if (!messageWindow) {
      showToast('Popup blocked. Please allow popups for this site.', true);
      return;
    }

    const otpSection = message.otp ? `
      <div class="otp-section">
        <h2>OTP Code Detected</h2>
        <div class="otp-display">${message.otp}</div>
        <button class="copy-otp-button" data-otp="${message.otp}">Copy OTP</button>
      </div>
    ` : '';

    messageWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'">
        <title>${message.subject || 'No Subject'}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
            height: 100vh;
            box-sizing: border-box;
            overflow: hidden;
            user-select: none;
            -webkit-user-select: none;
            border: none;
            -webkit-app-region: drag;
          }
          .close-button {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: #ff4444;
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            line-height: 1;
            padding: 0;
            z-index: 1000;
            -webkit-app-region: no-drag;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          }
          .header {
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 20px;
            position: relative;
          }
          .message-time {
            color: #666;
            font-size: 0.9em;
            margin: 5px 0;
          }
          .message-content {
            margin-top: 20px;
            overflow-y: auto;
            max-height: calc(100vh - 120px);
            user-select: text;
            -webkit-user-select: text;
          }
          .otp-section {
            background: #f0f8ff;
            padding: 15px;
            margin: 10px 0 20px 0;
            border-radius: 8px;
            border: 2px solid #4a90e2;
            text-align: center;
          }
          .otp-display {
            font-size: 28px;
            font-weight: bold;
            color: #4a90e2;
            text-align: center;
            padding: 15px;
            letter-spacing: 3px;
            background: white;
            border-radius: 4px;
            margin: 10px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .copy-otp-button {
            background: #4a90e2;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.2s;
          }
          .copy-otp-button:hover {
            background: #3a7bc8;
          }
          .otp-badge {
            background: #4a90e2;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            margin-left: 8px;
          }
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        </style>
        <script nonce="${nonce}">
          document.addEventListener('DOMContentLoaded', () => {
            const copyButton = document.querySelector('.copy-otp-button');
            if (copyButton) {
              copyButton.addEventListener('click', () => {
                const otp = copyButton.dataset.otp;
                navigator.clipboard.writeText(otp)
                  .then(() => {
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => {
                      copyButton.textContent = 'Copy OTP';
                    }, 2000);
                  })
                  .catch(err => {
                    console.error('Failed to copy: ', err);
                    alert('Failed to copy OTP');
                  });
              });
            }

            const closeButton = document.querySelector('.close-button');
            if (closeButton) {
              closeButton.addEventListener('click', () => window.close());
            }
          });
        </script>
      </head>
      <body>
        ${otpSection}
        <div class="message-content">
          <h3>${message.subject || 'No Subject'}</h3>
          <p><strong>From:</strong> ${message.from_name || 'Unknown Sender'}</p>
          <p><strong>Date:</strong> ${new Date(message.received_at * 1000).toLocaleString()}</p>
          <div class="message-body">${message.body_html || message.body_text || 'No content'}</div>
        </div>
        <button class="close-button">×</button>
      </body>
      </html>
    `);
    messageWindow.document.close();
  }

  function hideMessageDetail() {
    messageDetailElement.classList.remove('active');
    messageDetailContentElement.innerHTML = '';
  }

  function findLatestOtp(messages) {
    if (!messages || messages.length === 0) return null;
    
    const sortedMessages = [...messages].sort((a, b) => b.received_at - a.received_at);
    
    const messageWithOtp = sortedMessages.find(message => {
      return message.otp && message.otp.trim().length > 0;
    });
    
    return messageWithOtp ? messageWithOtp.otp : null;
  }

  function displayMessages(messages) {
    messagesListElement.innerHTML = '';
    if (messages.length === 0) {
      messagesListElement.innerHTML = '<div class="message-item">No emails found</div>';
      updateLatestOtp(null);
      return;
    }

    const latestOtp = findLatestOtp(messages);
    updateLatestOtp(latestOtp);

    const sortedMessages = [...messages].sort((a, b) => b.received_at - a.received_at);

    sortedMessages.forEach(message => {
      const messageElement = document.createElement('div');
      messageElement.className = 'message-item';
      
      const otpBadge = message.otp ? `
        <span class="otp-badge" title="Click to copy OTP" data-otp="${message.otp}">
          OTP: ${message.otp}
        </span>
      ` : '';
      
      messageElement.innerHTML = `
        <div class="message-header">
          <span class="message-subject">${message.from_name || 'Unknown Sender'} - ${message.subject || 'No Subject'}</span>
          ${otpBadge}
        </div>
        <div class="message-meta">
          <span class="message-from">${message.from_name || 'Unknown Sender'}</span>
          <span class="message-time">${new Date(message.received_at * 1000).toLocaleString()}</span>
        </div>
      `;
      
      messageElement.addEventListener('click', () => showMessageDetail(message));
      
      const badge = messageElement.querySelector('.otp-badge');
      if (badge) {
        badge.addEventListener('click', (e) => {
          e.stopPropagation();
          const otp = badge.getAttribute('data-otp');
          copyToClipboard(otp);
        });
      }
      
      messagesListElement.appendChild(messageElement);
    });
  }

  async function checkMessages(inboxId) {
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'checkEmails', 
        inboxId, 
        filters: currentFilters 
      });
      if (response.success) {
        displayMessages(response.messages);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error checking mail:', error);
      showToast('Failed to check mail', true);
    }
  }

  async function addEmailToHistory(email) {
    try {
      const { emailHistory = [] } = await chrome.storage.local.get(['emailHistory']);
      const newEntry = { email, timestamp: Date.now() };
      
      if (!emailHistory.some(entry => entry.email === email)) {
        emailHistory.push(newEntry);
        await chrome.storage.local.set({ emailHistory });
      }
    } catch (error) {
      console.error('Error updating email history:', error);
    }
  }

  async function updateEmailHistory() {
    try {
      const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
      
      if (inboxes.length === 0) {
        emailHistoryList.innerHTML = '<div class="email-history-item">No previous email addresses</div>';
        return;
      }

      inboxes.sort((a, b) => b.createdAt - a.createdAt);
      
      const isFullView = historyViewActive;
      const emailsToShow = isFullView ? inboxes : inboxes.slice(0, 5);

      emailHistoryList.innerHTML = emailsToShow
        .map(inbox => {
          const timeLeft = inbox.expiresAt ? calculateTimeLeft(inbox.expiresAt) : null;
          const expiryWarning = timeLeft && timeLeft <= 3600 ? ' expiry-warning' : '';
          const expiryText = timeLeft ? `Expires in ${formatTimeLeft(timeLeft)}` : '';
          
          return `
            <div class="email-history-item${isFullView ? ' full-view' : ''}${expiryWarning}">
              <span class="email-history-address">${inbox.address}</span>
              <span class="email-history-timestamp">${new Date(inbox.createdAt).toLocaleString()}</span>
              ${expiryText ? `<span class="email-history-expiry">${expiryText}</span>` : ''}
            </div>
          `;
        })
        .join('');
        
      if (!isFullView && inboxes.length > 5) {
        const viewAllLink = document.createElement('div');
        viewAllLink.className = 'view-all-link';
        viewAllLink.textContent = `View all (${inboxes.length})`;
        viewAllLink.addEventListener('click', () => {
          historyButton.click();
        });
        emailHistoryList.appendChild(viewAllLink);
      }

    } catch (error) {
      console.error('Error loading email history:', error);
      emailHistoryList.innerHTML = '<div class="email-history-item">Error loading email history</div>';
    }
  }

  function calculateTimeLeft(expiresAt) {
    return Math.max(0, expiresAt - Date.now());
  }

  function formatTimeLeft(seconds) {
    const hours = Math.floor(seconds / 3600000);
    const minutes = Math.floor((seconds % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  async function deleteInbox(inboxId) {
    try {
      const { inboxes = [], activeInboxId } = await chrome.storage.local.get(['inboxes', 'activeInboxId']);
      const updatedInboxes = inboxes.filter(inbox => inbox.id !== inboxId);
      await chrome.storage.local.set({ inboxes: updatedInboxes });
      
      if (activeInboxId === inboxId) {
        const newActiveInbox = updatedInboxes.length > 0 ? updatedInboxes[0].id : null;
        await chrome.storage.local.set({ activeInboxId: newActiveInbox });
      }
      
      await updateInboxDisplay();
      if (updatedInboxes.length > 0 && activeInboxId === inboxId) {
        checkMessages(updatedInboxes[0].id);
      } else if (updatedInboxes.length === 0) {
        dropdownSelected.textContent = 'Select an inbox';
        copyEmailButton.style.display = 'none';
        messagesListElement.innerHTML = '<div class="message-item">No mail yet</div>';
        updateLatestOtp(null);
      }
      showToast('Inbox deleted');
    } catch (error) {
      console.error('Error deleting inbox:', error);
      showToast('Failed to delete inbox', true);
    }
  }

  async function updateInboxDisplay() {
    try {
      const { inboxes = [], activeInboxId } = await chrome.storage.local.get(['inboxes', 'activeInboxId']);
      
      dropdownList.innerHTML = '';

      if (inboxes.length === 0) {
        const newInbox = await chrome.runtime.sendMessage({ type: 'createInbox' });
        if (newInbox.success) {
          await chrome.storage.local.set({ activeInboxId: newInbox.inbox.id });
          inboxes.push(newInbox.inbox);
          await chrome.storage.local.set({ inboxes });
          await addEmailToHistory(newInbox.inbox.address);
        } else {
          throw new Error(newInbox.error);
        }
      }

      inboxes.forEach(inbox => {
        const li = document.createElement('li');
        li.setAttribute('data-id', inbox.id);
        const timeLeft = inbox.expiresAt ? calculateTimeLeft(inbox.expiresAt) : null;
        const expiryText = timeLeft ? ` (Expires in ${formatTimeLeft(timeLeft)})` : '';
        li.innerHTML = `
          <span>${inbox.address}${expiryText}</span>
          <button class="delete-button" title="Delete Inbox">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-12 0v14a2 2 0 002 2h10a2 2 0 002-2V6M10 11v6M14 11v6"/>
            </svg>
          </button>
        `;
        if (inbox.id === activeInboxId) {
          dropdownSelected.textContent = inbox.address;
          copyEmailButton.style.display = 'inline-flex';
        }
        dropdownList.appendChild(li);

        const deleteButton = li.querySelector('.delete-button');
        deleteButton.addEventListener('click', async (e) => {
          e.stopPropagation();
          await deleteInbox(inbox.id);
        });

        li.addEventListener('click', async () => {
          await chrome.storage.local.set({ activeInboxId: inbox.id });
          dropdownSelected.textContent = inbox.address;
          copyEmailButton.style.display = 'inline-flex';
          dropdownList.style.display = 'none';
          await checkMessages(inbox.id);
        });
      });

      if (activeInboxId) {
        const activeInbox = inboxes.find(inbox => inbox.id === activeInboxId);
        if (activeInbox) {
          dropdownSelected.textContent = activeInbox.address;
          copyEmailButton.style.display = 'inline-flex';
          await checkMessages(activeInboxId);
        } else {
          copyEmailButton.style.display = 'none';
        }
      } else {
        dropdownSelected.textContent = 'Select an inbox';
        copyEmailButton.style.display = 'none';
      }
    } catch (error) {
      console.error('Error updating inbox display:', error);
      showToast('Failed to load inboxes', true);
    }
  }

  async function initializeInboxes() {
    await updateInboxDisplay();
    await updateEmailHistory();
    await updateAnalyticsDashboard();
    await initializeNotifications();
  }

  inboxDropdown.addEventListener('click', () => {
    dropdownList.style.display = dropdownList.style.display === 'block' ? 'none' : 'block';
  });

  addInboxButton.addEventListener('click', async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'createInbox' });
      if (response.success) {
        const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
        inboxes.push(response.inbox);
        await chrome.storage.local.set({ inboxes, activeInboxId: response.inbox.id });
        await addEmailToHistory(response.inbox.address);
        await updateInboxDisplay();
        await checkMessages(response.inbox.id);
        await updateAnalyticsDashboard();
        showToast('New inbox created');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error creating inbox:', error);
      showToast('Failed to create inbox', true);
    }
  });

  refreshMessagesButton.addEventListener('click', async () => {
    try {
      const { activeInboxId } = await chrome.storage.local.get(['activeInboxId']);
      if (activeInboxId) {
        await checkMessages(activeInboxId);
        await updateAnalyticsDashboard();
        showToast('Messages refreshed');
      } else {
        showToast('No inbox selected', true);
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
      showToast('Failed to refresh messages', true);
    }
  });

  // Debounce function to limit rapid search updates
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const debouncedCheckMessages = debounce(async (inboxId) => {
    await checkMessages(inboxId);
  }, 300);

  searchMessagesInput.addEventListener('input', async () => {
    currentFilters.searchQuery = searchMessagesInput.value.trim();
    const { activeInboxId } = await chrome.storage.local.get(['activeInboxId']);
    if (activeInboxId) {
      debouncedCheckMessages(activeInboxId);
    }
  });

  otpFilterCheckbox.addEventListener('change', async () => {
    currentFilters.hasOTP = otpFilterCheckbox.checked;
    const { activeInboxId } = await chrome.storage.local.get(['activeInboxId']);
    if (activeInboxId) {
      await checkMessages(activeInboxId);
    }
  });

  startSignupButton.addEventListener('click', async () => {
    try {
      const { activeInboxId, inboxes = [] } = await chrome.storage.local.get(['activeInboxId', 'inboxes']);
      if (!activeInboxId) {
        showToast('No inbox selected', true);
        return;
      }
      const activeInbox = inboxes.find(inbox => inbox.id === activeInboxId);
      if (!activeInbox) {
        showToast('Invalid inbox', true);
        return;
      }
      await chrome.runtime.sendMessage({ type: 'startSignup', email: activeInbox.address });
      showToast('Autofill started');
    } catch (error) {
      console.error('Error starting signup:', error);
      showToast('Failed to start autofill', true);
    }
  });

  backButton.addEventListener('click', () => {
    hideMessageDetail();
  });

  async function updateSavedLoginInfo() {
    try {
      const { loginInfo = {} } = await chrome.storage.local.get(['loginInfo']);
      
      if (Object.keys(loginInfo).length === 0) {
        savedLoginInfo.innerHTML = '<div class="login-info-item">No saved login information</div>';
        return;
      }

      const sortedDomains = Object.keys(loginInfo).sort();
      const isFullView = loginInfoViewActive;
      const domainsToShow = isFullView ? sortedDomains : sortedDomains.slice(0, 3);

      savedLoginInfo.innerHTML = domainsToShow
        .map(domain => {
          const entries = loginInfo[domain] || [];
          const sortedEntries = entries.sort((a, b) => b.timestamp - a.timestamp);
          
          const credentialsHtml = sortedEntries
            .map(entry => `
              <div class="login-info-entry">
                <div class="login-info-timestamp">${new Date(entry.timestamp).toLocaleString()}</div>
                <div class="login-info-credentials">
                  ${entry.username ? `
                    <div class="login-info-field">
                      <span class="login-info-label">Username:</span>
                      <span class="login-info-value">${entry.username}</span>
                      <button class="login-info-copy" data-value="${entry.username}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  ` : ''}
                  ${entry.email ? `
                    <div class="login-info-field">
                      <span class="login-info-label">Email:</span>
                      <span class="login-info-value">${entry.email}</span>
                      <button class="login-info-copy" data-value="${entry.email}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  ` : ''}
                  ${entry.password ? `
                    <div class="login-info-field">
                      <span class="login-info-label">Password:</span>
                      <span class="login-info-value">${entry.password}</span>
                      <button class="login-info-copy" data-value="${entry.password}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  ` : ''}
                </div>
              </div>
            `)
            .join('');

          return `
            <div class="login-info-item">
              <div class="login-info-domain">${domain}</div>
              ${credentialsHtml}
            </div>
          `;
        })
        .join('');

      if (!isFullView && sortedDomains.length > 3) {
        const viewAllButton = document.createElement('button');
        viewAllButton.className = 'view-all-button';
        viewAllButton.textContent = `View all (${sortedDomains.length})`;
        viewAllButton.addEventListener('click', () => {
          loginInfoButton.click();
        });
        savedLoginInfo.appendChild(viewAllButton);
      }

      const copyButtons = savedLoginInfo.querySelectorAll('.login-info-copy');
      copyButtons.forEach(button => {
        button.addEventListener('click', () => {
          const value = button.getAttribute('data-value');
          copyToClipboard(value);
        });
      });
    } catch (error) {
      console.error('Error loading login info:', error);
      savedLoginInfo.innerHTML = '<div class="login-info-item">Error loading login information</div>';
    }
  }

  async function fetchAnalyticsWithRetry(maxRetries = 3, delay = 500) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ type: 'getAnalytics' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });

        if (!response) {
          throw new Error('No response received from background script');
        }

        if (response.success && response.analytics) {
          console.log('Analytics fetched successfully:', response.analytics);
          return response.analytics;
        } else {
          throw new Error(response.error || 'No analytics data received');
        }
      } catch (error) {
        console.warn(`Analytics fetch attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async function updateAnalyticsDashboard() {
    try {
      const analytics = await fetchAnalyticsWithRetry();
      
      const createdAt = analytics.createdAt ? new Date(analytics.createdAt).toLocaleDateString() : 'N/A';
      const inboxesCreated = analytics.inboxesCreated || 0;
      const emailsReceived = analytics.emailsReceived || 0;
      const otpsDetected = analytics.otpsDetected || 0;
      const notificationsSent = analytics.notificationsSent || 0;

      analyticsDashboard.innerHTML = `
        <div class="analytics-item">
          <span class="analytics-label">Tracking Since:</span>
          <span class="analytics-value">${createdAt}</span>
        </div>
        <div class="analytics-item">
          <span class="analytics-label">Inboxes Created:</span>
          <span class="analytics-value">${inboxesCreated}</span>
        </div>
        <div class="analytics-item">
          <span class="analytics-label">Emails Received:</span>
          <span class="analytics-value">${emailsReceived}</span>
        </div>
        <div class="analytics-item">
          <span class="analytics-label">OTPs Detected:</span>
          <span class="analytics-value">${otpsDetected}</span>
        </div>
        <div class="analytics-item">
          <span class="analytics-label">Notifications Sent:</span>
          <span class="analytics-value">${notificationsSent}</span>
        </div>
      `;
    } catch (error) {
      console.error('Error loading analytics:', error);
      analyticsDashboard.innerHTML = '<div class="analytics-item">Failed to load analytics. Please try again.</div>';
      showToast('Failed to load analytics', true);
    }
  }

  await initializeInboxes();
});