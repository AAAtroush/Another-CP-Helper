// Firebase Configuration
// TODO: Replace with your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDX9anrwJs6luB8HpLc1qoTvjVz1ZV1CiI",
    authDomain: "another-cp-helper.firebaseapp.com",
    projectId: "another-cp-helper",
    storageBucket: "another-cp-helper.firebasestorage.app",
    messagingSenderId: "96214849866",
    appId: "1:96214849866:web:22610c5062d648243b49b3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Global state
let currentUser = null;
let isAdmin = false;
let cards = [];
let completedCards = [];

// DOM Elements
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

// Admin emails (you can move this to Firestore for better management)
const ADMIN_EMAILS = ['amhemdeod@gmail.com', 'momen.atroush605@gmail.com']; // Replace with your admin email

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkAuthState();
  loadCompletedCards();
  
  // Check if we need to open edit modal from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const editCardId = urlParams.get('edit');
  if (editCardId) {
    // Wait for auth and cards to load, then open edit modal
    auth.onAuthStateChanged(async (user) => {
      if (user && ADMIN_EMAILS.includes(user.email)) {
        await loadCards();
        const cardToEdit = cards.find(c => c.id === editCardId);
        if (cardToEdit) {
          setTimeout(() => {
            openAdminModal(cardToEdit);
            // Remove edit parameter from URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }, 500);
        }
      }
    });
  }
});

// Event Listeners
function setupEventListeners() {
  loginBtn?.addEventListener('click', () => {
    loginModal.classList.add('active');
    setAuthMode('login'); // Default to login when opening modal
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
      loginForm.reset(); // Reset login form as well
      document.getElementById('loginError').classList.remove('show');
    });
  });

  cancelEdit?.addEventListener('click', () => {
    adminModal.classList.remove('active');
    adminForm.reset();
    document.getElementById('editingCardId').value = '';
  });

  // Close modal on outside click
  [loginModal, adminModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        if (modal === adminModal) {
          adminForm.reset();
          document.getElementById('editingCardId').value = '';
        }
        if (modal === loginModal) {
          loginForm.reset();
          document.getElementById('loginError').classList.remove('show');
        }
      }
    });
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

let authMode = 'login'; // 'login' or 'signup'

function setAuthMode(mode) {
  authMode = mode;
  const isLogin = mode === 'login';
  
  authSubmitBtn.textContent = isLogin ? 'تسجيل الدخول' : 'إنشاء حساب';
  document.querySelector('.switch-auth-mode:nth-of-type(1)').style.display = isLogin ? 'block' : 'none'; // 'ليس لديك حساب؟ إنشاء حساب'
  document.querySelector('.switch-auth-mode:nth-of-type(2)').style.display = isLogin ? 'none' : 'block'; // 'لديك حساب بالفعل؟ تسجيل الدخول'
  
  // Clear error message and form fields when switching modes
  document.getElementById('loginError').classList.remove('show');
  loginForm.reset();
}

// Authentication
function checkAuthState() {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      isAdmin = ADMIN_EMAILS.includes(user.email);
      updateUIForLoggedIn(user);
      await loadCompletedCards();
      await loadCards();
    } else {
      currentUser = null;
      isAdmin = false;
      updateUIForLoggedOut();
      cards = [];
      completedCards = [];
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
    } else { // signup mode
      await auth.createUserWithEmailAndPassword(email, password);
    }
    
    loginModal.classList.remove('active');
    loginForm.reset();
    
    // Force reload cards after successful auth
    // The auth state change should handle this, but we'll ensure it happens
    setTimeout(async () => {
      await loadCompletedCards();
      await loadCards();
    }, 100);
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
  
  // Double check admin status
  isAdmin = ADMIN_EMAILS.includes(user.email);
  
  if (isAdmin) {
    adminControls.style.display = 'block';
    const adminDebug = document.getElementById('adminDebug');
    if (adminDebug) adminDebug.style.display = 'none';
    console.log('✅ Admin mode enabled for:', user.email);
    console.log('✅ Admin controls should be visible now');
  } else {
    adminControls.style.display = 'none';
    const adminDebug = document.getElementById('adminDebug');
    if (adminDebug) adminDebug.style.display = 'block';
    console.log('❌ Regular user:', user.email);
    console.log('❌ Admin emails list:', ADMIN_EMAILS);
    console.log('❌ Is email in admin list?', ADMIN_EMAILS.includes(user.email));
  }
}

function updateUIForLoggedOut() {
  userGreeting.style.display = 'none';
  loginSection.style.display = 'block';
  welcomeText.textContent = 'مرحباً بك!';
  welcomeSection.querySelector('p').textContent = 'سجل الدخول للبدء';
  adminControls.style.display = 'none';
}

// Cards Management
async function loadCards() {
  try {
    // Try to load with orderBy first, but fallback to simple get if index doesn't exist
    let snapshot;
    try {
      snapshot = await db.collection('cards').orderBy('createdAt', 'desc').get();
    } catch (orderError) {
      // If orderBy fails (likely missing index), just get all cards
      console.warn('OrderBy failed, loading without order:', orderError);
      snapshot = await db.collection('cards').get();
    }
    
    cards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort manually if orderBy failed
    if (cards.length > 0 && cards[0].createdAt) {
      cards.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
    }
    
    renderCards();
  } catch (error) {
    console.error('Error loading cards:', error);
    // Show user-friendly message
    if (error.code === 'permission-denied') {
      cardsContainer.innerHTML = '<p style="text-align: center; color: var(--danger); grid-column: 1/-1;">خطأ في الصلاحيات. يرجى التحقق من إعدادات Firestore.</p>';
    } else {
      cards = [];
      renderCards();
    }
  }
}

async function loadCompletedCards() {
  try {
    if (!currentUser) {
      completedCards = [];
      return;
    }
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    if (userDoc.exists) {
      completedCards = userDoc.data().completedCards || [];
    } else {
      completedCards = [];
    }
  } catch (error) {
    console.error('Error loading completed cards:', error);
    completedCards = [];
  }
}

function renderCards() {
  // Check auth state directly if currentUser seems null
  const authUser = auth.currentUser;
  if (!currentUser && !authUser) {
    cardsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">سجل الدخول لعرض البطاقات</p>';
    return;
  }

  // Update currentUser if it's null but authUser exists
  if (!currentUser && authUser) {
    currentUser = authUser;
    isAdmin = ADMIN_EMAILS.includes(authUser.email);
  }

  if (cards.length === 0) {
    let message = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">لا توجد بطاقات متاحة</p>';
    if (isAdmin) {
      message += '<p style="text-align: center; color: var(--primary); margin-top: 12px; font-weight: 600;">أنت مسؤول - اضغط على زر "إضافة بطاقة جديدة" أدناه لإنشاء أول بطاقة</p>';
    }
    cardsContainer.innerHTML = message;
    return;
  }

  cardsContainer.innerHTML = cards.map(card => createCardHTML(card)).join('');
  
  // Add event listeners to cards
  cards.forEach(card => {
    const cardElement = document.getElementById(`card-${card.id}`);
    if (cardElement) {
      // Card click - navigate to card page
      cardElement.addEventListener('click', (e) => {
        if (!e.target.closest('.card-actions')) {
          window.location.href = `./guide/card.html?id=${card.id}`;
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
  
  return `
    <div class="card ${isCompleted ? 'completed' : ''}" id="card-${card.id}">
      <div class="card-header">
        <h3 class="card-title">${card.title || 'بدون عنوان'}</h3>
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
    document.getElementById('cardTitle').value = card.title || '';
    document.getElementById('cardDescription').value = card.description || '';
    document.getElementById('cardCategory').value = card.category || '';
    document.getElementById('cardDifficulty').value = card.difficulty || 'متوسط';
    document.getElementById('cardContent').value = card.content || '';
    document.getElementById('editingCardId').value = card.id;
  } else {
    adminForm.reset();
    document.getElementById('editingCardId').value = '';
  }
  adminModal.classList.add('active');
}

async function handleAdminSubmit(e) {
  e.preventDefault();
  
  // Double check admin status
  if (!currentUser) {
    alert('يجب تسجيل الدخول أولاً');
    return;
  }
  
  // Re-check admin status with current user email
  const userEmail = currentUser.email;
  const isUserAdmin = ADMIN_EMAILS.includes(userEmail);
  
  console.log('=== Admin Check ===');
  console.log('User email:', userEmail);
  console.log('Admin emails list:', ADMIN_EMAILS);
  console.log('Is admin?', isUserAdmin);
  console.log('isAdmin variable:', isAdmin);
  
  if (!isUserAdmin) {
    alert(`ليس لديك صلاحيات المسؤول\nالبريد: ${userEmail}\n\nإذا كنت مسؤول، أضف بريدك إلى ADMIN_EMAILS في home.js`);
    return;
  }

  const cardId = document.getElementById('editingCardId').value;
  const cardData = {
    title: document.getElementById('cardTitle').value.trim(),
    description: document.getElementById('cardDescription').value.trim(),
    category: document.getElementById('cardCategory').value.trim(),
    difficulty: document.getElementById('cardDifficulty').value,
    content: document.getElementById('cardContent').value.trim(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  // Validate required fields
  if (!cardData.title || !cardData.description) {
    alert('الرجاء ملء جميع الحقول المطلوبة');
    return;
  }

  try {
    let savedCardId = cardId;
    
    if (cardId) {
      // Update existing card
      console.log('Updating card:', cardId, cardData);
      await db.collection('cards').doc(cardId).update(cardData);
      console.log('Card updated successfully');
    } else {
      // Create new card
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
    
    // If we came from card page, redirect back
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('edit') && savedCardId) {
      window.location.href = `./guide/card.html?id=${savedCardId}`;
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

