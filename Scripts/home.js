function _d(s, k) {
    try {
        const b = atob(s);
        let r = '';
        for (let i = 0; i < b.length; i++) {
            r += String.fromCharCode(b.charCodeAt(i) ^ k.charCodeAt(i % k.length));
        }
        return r;
    } catch (e) {
        return '';
    }
}

const _fc = {
    a: _d('KngRUDhIL2lSUAVDHHsYBwdEKQkjQSdSWkAEZR1bPUtaaz0AKFgi', 'k1'),
    b: _d('ClwERgNXGR8IQkZaDl4bVxkcDVsZVwlTGFcKQhscCF0G', 'k2'),
    c: _d('Cl0ERwNWGR4IQ0ZbDl8bVhk=', 'k3'),
    d: _d('CloEQANRGRkIREZcDlgbURkaDV0ZUQlVGFEYQARGClMOGgpEGw==', 'k4'),
    e: _d('UgNZBF8NXwxTA10=', 'k5'),
    f: _d('WgxSAFkHXw5fD1MAXQwcUwkMWQRdB1tVXgZdBA8AXw5ZAlhUXw8JBQ==', 'k6')
};

const firebaseConfig = {
    apiKey: _fc.a,
    authDomain: _fc.b,
    projectId: _fc.c,
    storageBucket: _fc.d,
    messagingSenderId: _fc.e,
    appId: _fc.f
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Enable persistence for offline support
try {
  db.enablePersistence({
    synchronizeTabs: true
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence not available in this browser');
    } else {
      console.warn('Firestore persistence error:', err);
    }
  });
} catch (e) {
  console.warn('Could not enable Firestore persistence:', e);
}

let currentUser = null;
let isAdmin = false;
let cards = [];
let completedCards = [];
let solvedProblemsCount = 0;
let totalProblemsCount = 0;
let solvingProblemsCount = 0;
window.isLoadingCards = false;

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginSection = document.getElementById('loginSection');
const userGreeting = document.getElementById('userGreeting');
const greetingText = document.getElementById('greetingText');
const loginModal = document.getElementById('loginModal');
const adminModal = document.getElementById('adminModal');
const loginForm = document.getElementById('loginForm');
const adminForm = document.getElementById('adminForm');
const cardsContainer = document.getElementById('cardsContainer');
const welcomeSection = document.getElementById('welcomeSection');
const welcomeText = document.getElementById('welcomeText');
const adminControls = document.getElementById('adminControls');
const addCardBtn = document.getElementById('addCardBtn');
const closeModals = document.querySelectorAll('.close-modal');
const cancelEdit = document.getElementById('cancelEdit');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const switchSignUp = document.getElementById('switchSignUp');
const switchSignIn = document.getElementById('switchSignIn');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');

const _ae = [
    _d('AAhZBAhVBApVIQJcAAxdTwZeDA==', 'ae1'),
    _d('DApfBAscABFADhBBCVMCVCVVDARbDUtRDgg=', 'ae2')
];
const ADMIN_EMAILS = _ae; 

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkAuthState();
  
  // Refresh solved problems count when page becomes visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentUser) {
      loadSolvedProblemsCount();
    }
  });
  
  // Also refresh when window gains focus (user comes back to tab)
  window.addEventListener('focus', () => {
    if (currentUser) {
      loadSolvedProblemsCount();
    }
  });
  
  // Refresh when returning from guide page (check for storage event or use pageshow)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted || (currentUser && document.visibilityState === 'visible')) {
      loadSolvedProblemsCount();
    }
  });
  
  // Listen for storage events (if guide page updates localStorage)
  window.addEventListener('storage', () => {
    if (currentUser) {
      loadSolvedProblemsCount();
    }
  });
  
  // Check sessionStorage on page load to see if problem status was updated
  if (sessionStorage.getItem('problemStatusUpdated')) {
    sessionStorage.removeItem('problemStatusUpdated');
    if (currentUser) {
      // Small delay to ensure Firebase has updated
      setTimeout(() => {
        loadSolvedProblemsCount();
      }, 500);
    }
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const editCardId = urlParams.get('edit');
  if (editCardId) {
    // Wait for auth state to be ready, then check if we can edit
    auth.onAuthStateChanged(async (user) => {
      try {
        if (user && ADMIN_EMAILS.includes(user.email)) {
          // Ensure cards are loaded
          if (cards.length === 0) {
            await loadCards();
          }
          const cardToEdit = cards.find(c => c.id === editCardId);
          if (cardToEdit) {
            // Use requestAnimationFrame for smoother UI update
            requestAnimationFrame(() => {
              openAdminModal(cardToEdit);
              window.history.replaceState({}, document.title, window.location.pathname);
            });
          }
        }
      } catch (error) {
        console.error('Error loading card for edit:', error);
      }
    });
  }
});

function setupEventListeners() {
  loginBtn?.addEventListener('click', () => {
    loginModal.classList.add('active');
    setAuthMode('login');
  });

  logoutBtn?.addEventListener('click', handleLogout);

  loginForm?.addEventListener('submit', handleAuthSubmit);

  adminForm?.addEventListener('submit', handleAdminSubmit);

  addCardBtn?.addEventListener('click', () => {
    openAdminModal();
  });

  closeModals.forEach(btn => {
    btn.addEventListener('click', () => {
      loginModal.classList.remove('active');
      adminModal.classList.remove('active');
      adminForm.reset();
      loginForm.reset();
      document.getElementById('loginError').classList.remove('show');
    });
  });

  cancelEdit?.addEventListener('click', () => {
    adminModal.classList.remove('active');
    adminForm.reset();
    document.getElementById('editingCardId').value = '';
  });

  adminModal.addEventListener('click', (e) => {
    if (e.target === adminModal) {
      adminModal.classList.remove('active');
      adminForm.reset();
      document.getElementById('editingCardId').value = '';
    }
  });

  switchSignUp?.addEventListener('click', (e) => {
    e.preventDefault();
    setAuthMode('signup');
  });

  switchSignIn?.addEventListener('click', (e) => {
    e.preventDefault();
    setAuthMode('login');
  });
}

let authMode = 'login';

function setAuthMode(mode) {
  authMode = mode;
  const isLogin = mode === 'login';
  
  authSubmitBtn.textContent = isLogin ? 'تسجيل الدخول' : 'إنشاء حساب';
  document.querySelector('.switch-auth-mode:nth-of-type(1)').style.display = isLogin ? 'block' : 'none'; 
  document.querySelector('.switch-auth-mode:nth-of-type(2)').style.display = isLogin ? 'none' : 'block';
  
  document.getElementById('loginError').classList.remove('show');
  loginForm.reset();
}

let authStateUnsubscribe = null;

function checkAuthState() {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      isAdmin = ADMIN_EMAILS.includes(user.email);
      updateUIForLoggedIn(user);
      await loadCompletedCards();
      await loadCards();
      await loadSolvedProblemsCount();
    } else {
      currentUser = null;
      isAdmin = false;
      updateUIForLoggedOut();
      cards = [];
      completedCards = [];
      window.isLoadingCards = false;
      renderCards();
    }
  });
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('loginError');

  try {
    errorMsg.classList.remove('show');
    errorMsg.textContent = '';

    if (authMode === 'login') {
      await auth.signInWithEmailAndPassword(email, password);
    } else { 
      await auth.createUserWithEmailAndPassword(email, password);
    }
    
    loginModal.classList.remove('active');
    loginForm.reset();
  } catch (error) {
    errorMsg.textContent = getErrorMessage(error.code);
    errorMsg.classList.add('show');
  }
}

function getErrorMessage(errorCode) {
  const messages = {
    'auth/user-not-found': 'المستخدم غير موجود',
    'auth/wrong-password': 'كلمة المرور غير صحيحة',
    'auth/invalid-email': 'البريد الإلكتروني غير صحيح',
    'auth/user-disabled': 'تم تعطيل هذا الحساب',
    'auth/too-many-requests': 'محاولات كثيرة جداً، حاول لاحقاً',
    'auth/network-request-failed': 'خطأ في الاتصال'
  };
  return messages[errorCode] || 'حدث خطأ أثناء تسجيل الدخول';
}

async function handleLogout() {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Logout error:', error);
  }
}

function updateUIForLoggedIn(user) {
  const displayName = user.displayName || user.email?.split('@')[0] || 'مستخدم';
  greetingText.textContent = `اهلاً يا ${displayName}`;
  userGreeting.style.display = 'flex';
  loginSection.style.display = 'none';
  welcomeText.textContent = `اهلاً يا ${displayName}!`;
  welcomeSection.querySelector('p').textContent = 'اختر بطاقة للبدء';
  
  // Show stats section
  const statsSection = document.getElementById('statsSection');
  if (statsSection) {
    statsSection.style.display = 'grid';
  }

  isAdmin = ADMIN_EMAILS.includes(user.email);
  
  if (isAdmin) {
    adminControls.style.display = 'block';
  } else {
    adminControls.style.display = 'none';
  }
  
  // Load solved problems count
  loadSolvedProblemsCount();
}

function updateUIForLoggedOut() {
  userGreeting.style.display = 'none';
  loginSection.style.display = 'block';
  welcomeText.textContent = 'مرحباً بك!';
  welcomeSection.querySelector('p').textContent = 'سجل الدخول للبدء';
  adminControls.style.display = 'none';
  
  // Hide stats section
  const statsSection = document.getElementById('statsSection');
  if (statsSection) {
    statsSection.style.display = 'none';
  }
  
  // Reset counter
  solvedProblemsCount = 0;
  updateSolvedProblemsCounter();
}

// Helper function to add timeout to promises
function withTimeout(promise, timeoutMs, errorMessage = 'Request timeout') {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

// Helper function to check if error is offline-related
function isOfflineError(error) {
  return error.code === 'unavailable' || 
         error.message?.includes('offline') || 
         error.message?.includes('Failed to get document because the client is offline') ||
         error.code === 'deadline-exceeded';
}

// Helper function to try cache as fallback
async function tryCacheFallback(queryFn, error) {
  if (isOfflineError(error)) {
    try {
      console.log('Trying cache fallback...');
      // Try to get from cache
      if (typeof queryFn === 'function') {
        // For queries, try with cache source
        return await queryFn({ source: 'cache' });
      }
    } catch (cacheError) {
      console.log('Cache fallback failed:', cacheError);
      // If cache also fails, throw original error
      throw error;
    }
  }
  throw error;
}

// Helper function for retry logic with exponential backoff and offline handling
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000, useCacheFallback = true) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on permission errors
      if (error.code === 'permission-denied') {
        throw error;
      }
      
      // If offline and we have cache fallback, try it
      if (isOfflineError(error) && useCacheFallback && attempt === maxRetries) {
        try {
          return await tryCacheFallback(fn, error);
        } catch (cacheError) {
          // If cache fails, continue with original error
          lastError = error;
        }
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Don't retry immediately if offline - wait longer
      if (isOfflineError(error)) {
        const delay = initialDelay * Math.pow(2, attempt) * 2; // Longer delay for offline
        console.log(`Offline detected, retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Exponential backoff: 1s, 2s, 4s
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// Cards Management
async function loadCards() {
  // Prevent multiple simultaneous loads
  if (window.isLoadingCards) {
    console.log('Cards already loading, skipping duplicate call');
    return;
  }
  
  window.isLoadingCards = true;
  let permissionDenied = false;
  let loadTimeout;
  let safetyTimeoutFired = false;
  let requestCompleted = false;

  try {
    // Show loading spinner
    if (cardsContainer) {
      cardsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
          <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="margin-top: 16px; color: var(--text-secondary);">جاري تحميل البطاقات...</p>
        </div>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      `;
    }
    
    // Set a safety timeout to prevent infinite loading (45 seconds for slow networks)
    loadTimeout = setTimeout(() => {
      if (window.isLoadingCards && !requestCompleted) {
        console.warn('Load cards safety timeout - forcing cleanup');
        safetyTimeoutFired = true;
        window.isLoadingCards = false;
        if (cardsContainer) {
          cardsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
              <p style="color: var(--danger); margin-bottom: 16px;">انتهت مهلة التحميل</p>
              <p style="color: var(--text-secondary); margin-bottom: 16px;">يبدو أن الاتصال بطيء جداً</p>
              <button onclick="loadCards()" style="padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">إعادة المحاولة</button>
            </div>
          `;
        }
      }
    }, 45000); // Increased to 45 seconds for slow networks
    
    // Load all cards with timeout and retry logic
    // Increased timeout and retries for slow networks
    // Try server first, fallback to cache if offline
    let snapshot;
    try {
      snapshot = await retryWithBackoff(async () => {
        return await withTimeout(
          db.collection('cards').get({ source: 'server' }),
          30000, // 30 second timeout per attempt (increased from 20)
          'Connection timeout'
        );
      }, 4, 1500, true); // 4 retries with 1.5s initial delay, enable cache fallback
    } catch (error) {
      // If all retries failed and we're offline, try cache
      if (isOfflineError(error)) {
        console.log('Server request failed, trying cache...');
        try {
          snapshot = await db.collection('cards').get({ source: 'cache' });
          console.log('Loaded cards from cache');
        } catch (cacheError) {
          // If cache also fails, throw original error
          throw error;
        }
      } else {
        throw error;
      }
    }
    
    requestCompleted = true;
    clearTimeout(loadTimeout);
    
    // Don't process if safety timeout already fired
    if (safetyTimeoutFired) {
      console.warn('Safety timeout fired before request completed');
      return;
    }
    
    cards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by cardId (ascending - lower ID appears first)
    cards.sort((a, b) => {
      const aId = a.cardId !== undefined && a.cardId !== null ? (typeof a.cardId === 'number' ? a.cardId : parseInt(a.cardId)) : 999999;
      const bId = b.cardId !== undefined && b.cardId !== null ? (typeof b.cardId === 'number' ? b.cardId : parseInt(b.cardId)) : 999999;
      
      if (!isNaN(aId) && !isNaN(bId)) {
        return aId - bId;
      }
      
      if (!isNaN(aId) && isNaN(bId)) return -1;
      if (isNaN(aId) && !isNaN(bId)) return 1;
      
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
    
    // Success - render cards
    renderCards();
  } catch (error) {
    requestCompleted = true;
    clearTimeout(loadTimeout);
    
    // Don't show error if safety timeout already fired
    if (safetyTimeoutFired) {
      console.warn('Safety timeout fired, skipping error handling');
      return;
    }
    
    console.error('Error loading cards:', error);

    if (error.code === 'permission-denied') {
      permissionDenied = true;
      if (cardsContainer) {
        cardsContainer.innerHTML = '<p style="text-align: center; color: var(--danger); grid-column: 1/-1;">خطأ في الصلاحيات. يرجى التحقق من إعدادات Firestore.</p>';
      }
    } else {
      // On error, try to render existing cards if available
      if (cards && cards.length > 0) {
        console.log('Error loading cards, but using cached cards');
        renderCards();
      } else {
        cards = [];
        
        // Show user-friendly error message
        if (cardsContainer) {
          const isNetworkError = error.message.includes('timeout') || 
                                error.message.includes('Connection') ||
                                error.code === 'unavailable' ||
                                error.code === 'deadline-exceeded';
          
          const errorMessage = isNetworkError 
            ? `
              <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
                <p style="color: var(--danger); margin-bottom: 16px; font-weight: 600;">فشل تحميل البطاقات</p>
                <p style="color: var(--text-secondary); margin-bottom: 8px;">يبدو أن الاتصال بالإنترنت بطيء أو غير مستقر</p>
                <p style="color: var(--text-secondary); margin-bottom: 16px; font-size: 14px;">${error.message || 'خطأ في الاتصال'}</p>
                <button onclick="loadCards()" style="padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600;">إعادة المحاولة</button>
              </div>
            `
            : `
              <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
                <p style="color: var(--danger); margin-bottom: 16px;">حدث خطأ أثناء تحميل البطاقات</p>
                <p style="color: var(--text-secondary); margin-bottom: 16px; font-size: 14px;">${error.message || 'خطأ غير معروف'}</p>
                <button onclick="loadCards()" style="padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">إعادة المحاولة</button>
              </div>
            `;
          
          cardsContainer.innerHTML = errorMessage;
        }
      }
    }
  } finally {
    window.isLoadingCards = false;
  }
}

async function loadCompletedCards() {
  try {
    if (!currentUser) {
      completedCards = [];
      return;
    }
    const userDoc = await retryWithBackoff(async () => {
      return await withTimeout(
        db.collection('users').doc(currentUser.uid).get(),
        10000, // 10 second timeout
        'Connection timeout'
      );
    }, 2, 1000);
    
    if (userDoc.exists) {
      completedCards = userDoc.data().completedCards || [];
    } else {
      completedCards = [];
    }
  } catch (error) {
    console.error('Error loading completed cards:', error);
    // Keep previous completedCards on error to avoid losing state
    if (!completedCards || completedCards.length === 0) {
      completedCards = [];
    }
  }
}

async function loadSolvedProblemsCount() {
  try {
    if (!currentUser) {
      solvedProblemsCount = 0;
      totalProblemsCount = 0;
      solvingProblemsCount = 0;
      updateSolvedProblemsCounter();
      return;
    }

    // Reuse already-loaded cards if available, otherwise load them
    let cardsToProcess = [];
    if (cards && cards.length > 0) {
      // Use already-loaded cards - create a compatible structure with id property
      cardsToProcess = cards.map(card => ({ 
        id: card.id
      }));
    } else {
      // Load cards if not already loaded (with timeout and retry)
      const cardsSnapshot = await retryWithBackoff(async () => {
        return await withTimeout(
          db.collection('cards').get(),
          15000, // 15 second timeout per attempt
          'Connection timeout'
        );
      }, 2, 1000); // Fewer retries for stats (less critical)
      cardsToProcess = cardsSnapshot.docs;
    }
    
    let totalSolved = 0;
    let totalProblems = 0;
    let totalSolving = 0;

    // For each card, check user statuses and count problems
    for (const cardDoc of cardsToProcess) {
      try {
        // Get card ID (handle both snapshot doc and plain object)
        const cardId = cardDoc.id;
        
        // Count total problems in this card with timeout
        const problemsSnapshot = await withTimeout(
          db.collection('cards')
            .doc(cardId)
            .collection('problems')
            .get(),
          10000, // 10 second timeout per card
          'Timeout loading problems'
        );
        totalProblems += problemsSnapshot.size;

        // Get user statuses with timeout
        const statusDoc = await withTimeout(
          db.collection('cards')
            .doc(cardId)
            .collection('userStatuses')
            .doc(currentUser.uid)
            .get(),
          10000, // 10 second timeout per status
          'Timeout loading statuses'
        );

        if (statusDoc.exists) {
          const statuses = statusDoc.data().statuses || {};
          // Count problems with status 'done'
          const solvedInCard = Object.values(statuses).filter(status => status === 'done').length;
          totalSolved += solvedInCard;
          
          // Count problems with status 'solving'
          const solvingInCard = Object.values(statuses).filter(status => status === 'solving').length;
          totalSolving += solvingInCard;
        }
      } catch (error) {
        // If permission denied or card has no problems, skip
        // Don't log timeout errors for individual cards to avoid spam
        const cardId = cardDoc.id;
        if (error.code !== 'permission-denied' && !error.message.includes('timeout')) {
          console.warn(`Error loading statuses for card ${cardId}:`, error);
        }
        continue;
      }
    }

    solvedProblemsCount = totalSolved;
    totalProblemsCount = totalProblems;
    solvingProblemsCount = totalSolving;
    updateSolvedProblemsCounter();
  } catch (error) {
    console.error('Error loading solved problems count:', error);
    // Don't reset to 0 on error - keep previous values
    // Only update if we have no previous values
    if (solvedProblemsCount === 0 && totalProblemsCount === 0) {
      updateSolvedProblemsCounter();
    }
  }
}

function updateSolvedProblemsCounter() {
  const counterElement = document.getElementById('solvedProblemsCount');
  if (counterElement) {
    const oldValue = parseInt(counterElement.textContent) || 0;
    counterElement.textContent = solvedProblemsCount;
    
    // Add animation if value changed
    if (oldValue !== solvedProblemsCount) {
      counterElement.style.transform = 'scale(1.3)';
      counterElement.style.color = 'var(--success)';
      setTimeout(() => {
        counterElement.style.transform = 'scale(1)';
        counterElement.style.color = '';
      }, 300);
    }
  }
  
  // Update total problems if element exists
  const totalElement = document.getElementById('totalProblemsCount');
  if (totalElement) {
    totalElement.textContent = totalProblemsCount;
  }
  
  // Update solving problems if element exists
  const solvingElement = document.getElementById('solvingProblemsCount');
  if (solvingElement) {
    solvingElement.textContent = solvingProblemsCount;
  }
}

function renderCards() {
  // Don't render if we're still loading (unless we have cards to show)
  if (window.isLoadingCards && (!cards || cards.length === 0)) {
    return;
  }
  
  if (!cardsContainer) {
    return;
  }
  
  const authUser = auth.currentUser;
  if (!currentUser && !authUser) {
    cardsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">سجل الدخول لعرض البطاقات</p>';
    return;
  }

  if (!currentUser && authUser) {
    currentUser = authUser;
    isAdmin = ADMIN_EMAILS.includes(authUser.email);
  }

  // Only show "no cards" message if we're sure loading is complete and cards array is empty
  if (cards.length === 0 && !window.isLoadingCards) {
    let message = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">لا توجد بطاقات متاحة</p>';
    if (isAdmin) {
      message += '<p style="text-align: center; color: var(--primary); margin-top: 12px; font-weight: 600;">أنت مسؤول - اضغط على زر "إضافة بطاقة جديدة" أدناه لإنشاء أول بطاقة</p>';
    }
    cardsContainer.innerHTML = message;
    return;
  }

  // Render cards even if loading flag is still set (in case of stuck state)
  if (cards && cards.length > 0) {
    cardsContainer.innerHTML = cards.map(card => createCardHTML(card)).join('');
  } else {
    return; // Don't proceed if no cards to render
  }
  
  cards.forEach(card => {
    const cardElement = document.getElementById(`card-${card.id}`);
    if (cardElement) {
      // Card click - navigate to card page
      cardElement.addEventListener('click', (e) => {
        if (!e.target.closest('.card-actions')) {
          window.location.href = `../guide/?id=${card.id}`;
        }
      });

      // Complete button
      const completeBtn = cardElement.querySelector('.complete-btn');
      if (completeBtn) {
        completeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleCardComplete(card.id);
        });
      }

      // Edit button (admin only)
      if (isAdmin) {
        const editBtn = cardElement.querySelector('.edit-btn');
        if (editBtn) {
          editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openAdminModal(card);
          });
        }

        const deleteBtn = cardElement.querySelector('.delete-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCard(card.id);
          });
        }
      }
    }
  });
}

function createCardHTML(card) {
  const isCompleted = completedCards.includes(card.id);
  const difficultyClass = card.difficulty === 'سهل' ? 'easy' : 
                          card.difficulty === 'متوسط' ? 'medium' : 'hard';
  const cardIdDisplay = card.cardId !== undefined && card.cardId !== null ? `#${card.cardId}` : '';
  
  return `
    <div class="card ${isCompleted ? 'completed' : ''}" id="card-${card.id}">
      <div class="card-header">
        <h3 class="card-title">
          ${cardIdDisplay ? `<span style="color: var(--text-secondary); font-size: 0.8em; margin-left: 8px;">${cardIdDisplay}</span>` : ''}
          ${card.title || 'بدون عنوان'}
        </h3>
        <div class="card-actions">
          <button class="complete-btn ${isCompleted ? 'completed' : ''}" title="تم">
            ${isCompleted ? '✓' : '○'}
          </button>
          ${isAdmin ? `
            <button class="edit-btn" title="تعديل">✎</button>
            <button class="delete-btn" title="حذف">×</button>
          ` : ''}
        </div>
      </div>
      <p class="card-description">${card.description || 'لا يوجد وصف'}</p>
      <div class="card-footer">
        <span class="card-category">${card.category || 'عام'}</span>
        <span class="card-difficulty ${difficultyClass}">${card.difficulty || 'متوسط'}</span>
      </div>
    </div>
  `;
}

async function toggleCardComplete(cardId) {
  if (!currentUser) return;

  try {
    const userRef = db.collection('users').doc(currentUser.uid);
    const isCompleted = completedCards.includes(cardId);

    if (isCompleted) {
      completedCards = completedCards.filter(id => id !== cardId);
    } else {
      completedCards.push(cardId);
    }

    await userRef.set({
      completedCards: completedCards
    }, { merge: true });

    await loadCompletedCards();
    renderCards();
  } catch (error) {
    console.error('Error toggling card completion:', error);
  }
}

// Admin Functions
function openAdminModal(card = null) {
  if (card) {
    document.getElementById('cardId').value = card.cardId || '';
    document.getElementById('cardTitle').value = card.title || '';
    document.getElementById('cardDescription').value = card.description || '';
    document.getElementById('cardCategory').value = card.category || '';
    document.getElementById('cardDifficulty').value = card.difficulty || 'متوسط';
    document.getElementById('cardContent').value = card.content || '';
    document.getElementById('editingCardId').value = card.id;
  } else {
    adminForm.reset();
    document.getElementById('editingCardId').value = '';
    // Set default cardId for new cards (next available ID)
    getNextCardId().then(nextId => {
      document.getElementById('cardId').value = nextId;
    });
  }
  adminModal.classList.add('active');
}

// Get next available card ID
async function getNextCardId() {
  try {
    const snapshot = await db.collection('cards').get();
    const existingIds = snapshot.docs
      .map(doc => doc.data().cardId)
      .filter(id => id !== undefined && id !== null)
      .map(id => typeof id === 'number' ? id : parseInt(id))
      .filter(id => !isNaN(id));
    
    if (existingIds.length === 0) return 1;
    return Math.max(...existingIds) + 1;
  } catch (error) {
    console.error('Error getting next card ID:', error);
    return 1;
  }
}

async function handleAdminSubmit(e) {
  e.preventDefault();
  
  if (!currentUser) {
    alert('يجب تسجيل الدخول أولاً');
    return;
  }
  
  const userEmail = currentUser.email;
  const isUserAdmin = ADMIN_EMAILS.includes(userEmail);
  
  if (!isUserAdmin) {
    alert(`ليس لديك صلاحيات المسؤول\nالبريد: ${userEmail}\n\nإذا كنت مسؤول، أضف بريدك إلى ADMIN_EMAILS في home.js`);
    return;
  }

  const cardId = document.getElementById('editingCardId').value;
  const cardIdValue = parseInt(document.getElementById('cardId').value);
  
  if (isNaN(cardIdValue) || cardIdValue < 0) {
    alert('الرجاء إدخال معرف صحيح (رقم أكبر من أو يساوي 0)');
    return;
  }
  
  const cardData = {
    cardId: cardIdValue,
    title: document.getElementById('cardTitle').value.trim(),
    description: document.getElementById('cardDescription').value.trim(),
    category: document.getElementById('cardCategory').value.trim(),
    difficulty: document.getElementById('cardDifficulty').value,
    content: document.getElementById('cardContent').value.trim(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (!cardData.title || !cardData.description) {
    alert('الرجاء ملء جميع الحقول المطلوبة');
    return;
  }

  try {
    let savedCardId = cardId;
    
    if (cardId) {
      console.log('Updating card:', cardId, cardData);
      await db.collection('cards').doc(cardId).update(cardData);
      console.log('Card updated successfully');
    } else {
      cardData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      console.log('Creating new card:', cardData);
      const docRef = await db.collection('cards').add(cardData);
      savedCardId = docRef.id;
      console.log('Card created successfully with ID:', savedCardId);
    }

    adminModal.classList.remove('active');
    adminForm.reset();
    document.getElementById('editingCardId').value = '';
    await loadCards();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('edit') && savedCardId) {
      window.location.href = `../guide/?id=${savedCardId}`;
    }
  } catch (error) {
    console.error('Error saving card:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Current user email:', currentUser?.email);
    console.error('Admin emails:', ADMIN_EMAILS);
    
    let errorMessage = 'حدث خطأ أثناء حفظ البطاقة';
    if (error.code === 'permission-denied') {
      errorMessage = `خطأ في الصلاحيات!\n\n` +
        `البريد المستخدم: ${currentUser?.email}\n` +
        `قائمة المسؤولين: ${ADMIN_EMAILS.join(', ')}\n\n` +
        `الحل:\n` +
        `1. تأكد من أن بريدك موجود في ADMIN_EMAILS في home.js\n` +
        `2. تأكد من أن قواعد Firestore تحتوي على بريدك بالضبط\n` +
        `3. افتح Firebase Console → Firestore → Rules\n` +
        `4. تأكد من أن القواعد تسمح للمسؤولين بالكتابة`;
    } else if (error.code === 'unavailable') {
      errorMessage = 'خطأ في الاتصال. تحقق من اتصالك بالإنترنت.';
    } else {
      errorMessage = `خطأ: ${error.message || error.code}`;
    }
    
    alert(errorMessage);
  }
}

async function deleteCard(cardId) {
  if (!isAdmin) return;
  if (!confirm('هل أنت متأكد من حذف هذه البطاقة؟')) return;

  try {
    await db.collection('cards').doc(cardId).delete();
    await loadCards();
  } catch (error) {
    console.error('Error deleting card:', error);
    alert('حدث خطأ أثناء حذف البطاقة');
  }
}

