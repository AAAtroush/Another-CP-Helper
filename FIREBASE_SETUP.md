# إعداد Firebase

## الخطوات:

1. **إنشاء مشروع Firebase:**
   - اذهب إلى [Firebase Console](https://console.firebase.google.com/)
   - أنشئ مشروع جديد أو استخدم مشروع موجود

2. **إعداد Authentication:**
   - في Firebase Console، اذهب إلى "Authentication"
   - اضغط "Get Started"
   - في تبويب "Sign-in method"، فعّل "Email/Password"

3. **إعداد Firestore:**
   - في Firebase Console، اذهب إلى "Firestore Database"
   - اضغط "Create database"
   - اختر "Start in test mode" (للاختبار) أو قم بإعداد قواعد الأمان المناسبة
   - اختر موقع قاعدة البيانات

4. **الحصول على معلومات التكوين:**
   - في Firebase Console، اذهب إلى Project Settings (⚙️)
   - في قسم "Your apps"، اختر "Web" (</>)
   - انسخ معلومات التكوين

5. **تحديث home.js:**
   - افتح `home.js`
   - استبدل `firebaseConfig` بقيمك من Firebase Console:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

6. **إعداد البريد الإلكتروني للمسؤول:**
   - في `home.js`، ابحث عن `ADMIN_EMAILS`
   - استبدل `'admin@example.com'` ببريدك الإلكتروني:
   ```javascript
   const ADMIN_EMAILS = ['your-email@example.com'];
   ```

7. **إنشاء حساب مسؤول:**
   - افتح الصفحة الرئيسية
   - سجل حساب جديد باستخدام البريد الإلكتروني الذي أضفته في `ADMIN_EMAILS`
   - أو استخدم Authentication في Firebase Console لإنشاء المستخدم

## هيكل قاعدة البيانات:

سيتم إنشاء المجموعات التالية تلقائياً:

- **cards**: البطاقات
  - `title` (string): عنوان البطاقة
  - `description` (string): الوصف
  - `category` (string): الفئة
  - `difficulty` (string): الصعوبة (سهل/متوسط/صعب)
  - `createdAt` (timestamp): تاريخ الإنشاء
  - `updatedAt` (timestamp): تاريخ التحديث

- **users**: معلومات المستخدمين
  - `completedCards` (array): قائمة بمعرفات البطاقات المكتملة

## قواعد الأمان (Firestore Rules) - **مهم جداً!**

**يجب تحديث قواعد Firestore لحل مشكلة الصلاحيات:**

1. في Firebase Console، اذهب إلى **"Firestore Database"**
2. اضغط على تبويب **"Rules"** (في الأعلى)
3. استبدل القواعد الحالية بالقواعد التالية:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // قواعد البطاقات (cards)
    match /cards/{cardId} {
      // السماح لجميع المستخدمين المسجلين بقراءة البطاقات
      allow read: if request.auth != null;
      // السماح للمسؤولين فقط بإنشاء وتعديل وحذف البطاقات
      allow create, update, delete: if request.auth != null && 
                                     request.auth.token.email in ['amhemdeod@gmail.com', 'Momen.atroush605@gmail.com'];
    }
    
    // قواعد المستخدمين (users)
    match /users/{userId} {
      // السماح للمستخدم بقراءة وكتابة بياناته الخاصة فقط
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. اضغط **"Publish"** لحفظ القواعد

**ملاحظات مهمة:**
- استبدل البريد الإلكتروني في القواعد ببريدك الإلكتروني إذا كان مختلفاً
- يمكنك إضافة المزيد من المسؤولين بإضافة بريدهم الإلكتروني في القائمة
- بعد تحديث القواعد، قد يستغرق الأمر بضع ثوانٍ حتى تصبح فعالة

