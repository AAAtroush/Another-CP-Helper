# إصلاح مشكلة الصلاحيات

## المشكلة:
خطأ في الصلاحيات عند محاولة حفظ البطاقة رغم أنك مسؤول.

## الحل السريع:

### 1. تحقق من بريدك الإلكتروني:
- افتح Console (F12)
- ابحث عن "User email:" و "Admin emails list:"
- تأكد أن بريدك موجود في القائمة

### 2. تحديث قواعد Firestore:

اذهب إلى [Firebase Console](https://console.firebase.google.com/) → مشروعك → **Firestore Database** → **Rules**

**استبدل القواعد الحالية بهذا الكود:**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /cards/{cardId} {
      // السماح لجميع المستخدمين المسجلين بقراءة البطاقات
      allow read: if request.auth != null;
      // السماح للمسؤولين فقط بإنشاء وتعديل وحذف البطاقات
      allow create, update, delete: if request.auth != null && 
                                     request.auth.token.email in ['amhemdeod@gmail.com', 'momen.atroush605@gmail.com'];
    }
    match /users/{userId} {
      // السماح للمستخدم بقراءة وكتابة بياناته الخاصة فقط
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**⚠️ مهم جداً:**
- استبدل البريد الإلكتروني في القواعد ببريدك بالضبط (بما في ذلك الحروف الكبيرة/الصغيرة)
- البريد يجب أن يطابق البريد المستخدم في تسجيل الدخول حرفياً

### 3. بعد تحديث القواعد:
1. اضغط **"Publish"** لحفظ القواعد
2. انتظر بضع ثوانٍ
3. أعد تحميل الصفحة
4. حاول حفظ البطاقة مرة أخرى

### 4. إذا استمرت المشكلة:

**تحقق من:**
- البريد الإلكتروني في `home.js` (سطر 48) يطابق بريدك
- البريد الإلكتروني في قواعد Firestore يطابق بريدك
- أنك سجلت الدخول بالبريد الصحيح

**مثال:**
- إذا كان بريدك: `momen.atroush605@gmail.com`
- يجب أن يكون موجود في `ADMIN_EMAILS` في `home.js`
- ويجب أن يكون موجود في قواعد Firestore

## اختبار سريع:

افتح Console (F12) واكتب:
```javascript
console.log('Current user:', firebase.auth().currentUser?.email);
console.log('Admin emails:', ['amhemdeod@gmail.com', 'momen.atroush605@gmail.com']);
```

إذا كان البريد مختلفاً، أضفه إلى القائمة!

