# 🎯 Another-CP-Helper

An interactive web platform for learning and visualizing algorithms & data structures, designed for competitive programming enthusiasts. This project was developed as part of the Qimma Hackathon.

## ✨ Features

### 🏠 Home Dashboard
- **User Authentication**: Secure login/signup system powered by Firebase Authentication
- **Interactive Cards System**: Browse learning cards with categories, difficulty levels, and completion tracking
- **Admin Panel**: Content management system for administrators to create, edit, and delete learning cards
- **Progress Tracking**: Mark cards as completed and track your learning progress
- **Real-time Data**: Firebase Firestore integration for real-time data synchronization

### 📊 Grid Visualizer
- **Interactive 2D Grid**: Create and manipulate 2D matrices with customizable dimensions
- **Cell Operations**: Fill, clear, and edit individual cells with ease
- **Grid Transformations**: 
  - Rotate matrices (90°, 180°, 270°)
  - Flip horizontally and vertically
  - Transpose operations
- **Code Formulas Library**: Pre-built code snippets for common matrix operations:
  - Matrix rotation algorithms
  - Prefix sum calculations
  - Matrix multiplication and exponentiation
  - Determinant calculations
  - And more!
- **Undo/Redo**: Full history management for grid operations
- **Template System**: Save and load grid templates

### 🔍 Algorithm Visualizers
- **BFS (Breadth-First Search)**: Interactive visualization of graph traversal
  - Step-by-step animation
  - Queue visualization
  - Path highlighting
- **DFS (Depth-First Search)**: Interactive visualization of depth-first traversal
  - Recursive and iterative modes
  - Stack visualization
  - Path tracking

### 📚 Learning Guides
- **Dynamic Content**: Firebase-powered content management
- **Rich Formatting**: HTML support for rich text content
- **Categorized Learning**: Cards organized by category and difficulty
- **Search & Filter**: Easy navigation through learning materials

## 🛠️ Technologies Used

- **Frontend**:
  - HTML5, CSS3, JavaScript (ES6+)
  - Firebase (Authentication & Firestore)
  - Google Fonts (Cairo, Tajawal)
  - Highlight.js for code syntax highlighting

- **Backend**:
  - Firebase Authentication
  - Cloud Firestore Database
  - Firebase Hosting (optional)

- **Design**:
  - Modern gradient-based UI
  - Responsive design (mobile-friendly)
  - RTL (Right-to-Left) support for Arabic content
  - Smooth animations and transitions

## 📁 Project Structure

```
Another-CP-Helper/
├── algo/                    # Algorithm visualizers
│   ├── bfs/                 # BFS visualizer
│   ├── dfs/                 # DFS visualizer
│   └── index.html           # Algorithm selection page
├── grid/                    # Grid visualizer
│   └── index.html           # Grid tool page
├── guide/                   # Learning guides
│   └── index.html           # Individual guide pages
├── home/                    # Home dashboard
│   └── index.html           # Main dashboard
├── Scripts/                 # JavaScript files
│   ├── bfs.js              # BFS algorithm logic
│   ├── dfs.js              # DFS algorithm logic
│   ├── home.js             # Home page logic & Firebase
│   ├── main.js             # Grid visualizer logic
│   └── navbar.js            # Navigation bar logic
├── Styles/                  # CSS stylesheets
│   ├── home.css            # Home page styles
│   ├── navbar.css          # Navigation styles
│   ├── style.css           # Global styles
│   └── traversals.css      # Algorithm visualizer styles
├── index.html              # Entry point (redirects to home)
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase account (for backend services)
- Web server (optional, for local development)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Another-CP-Helper.git
   cd Another-CP-Helper
   ```

2. **Firebase Configuration**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Update Firebase configuration in `Scripts/home.js` and `guide/index.html`
   - Set up Firestore security rules:
     ```javascript
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /cards/{cardId} {
           allow read: if true;
           allow write: if request.auth != null && 
             request.auth.token.email in ['admin@example.com'];
         }
         match /users/{userId} {
           allow read, write: if request.auth != null && 
             request.auth.uid == userId;
         }
       }
     }
     ```

3. **Local Development**
   - Option 1: Use a local web server
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js (http-server)
     npx http-server
     ```
   - Option 2: Open `index.html` directly in your browser (some features may not work)

4. **Access the Application**
   - Navigate to `http://localhost:8000` (or your chosen port)
   - The app will redirect to the home page

## 📖 Usage Guide

### For Users

1. **Sign Up / Login**
   - Click "تسجيل الدخول" (Login) button
   - Create an account or sign in with existing credentials

2. **Browse Learning Cards**
   - View available cards on the home page
   - Click on any card to view its content
   - Mark cards as completed using the checkmark button

3. **Use Grid Visualizer**
   - Navigate to "عرض الشبكة" (Grid Visualizer)
   - Set grid dimensions
   - Fill cells and perform operations
   - Use the formulas section for code snippets

4. **Explore Algorithms**
   - Go to "عرض الخوارزميات" (Algorithm Visualizers)
   - Select BFS or DFS
   - Create a graph and visualize the algorithm step-by-step

### For Administrators

1. **Admin Access**
   - Login with an admin email (configured in `Scripts/home.js`)
   - Admin controls will appear automatically

2. **Manage Cards**
   - Click "إضافة بطاقة جديدة" (Add New Card) to create cards
   - Edit existing cards using the edit button (✎)
   - Delete cards using the delete button (×)

3. **Card Properties**
   - **Card ID**: Used for sorting (lower numbers appear first)
   - **Title**: Card heading
   - **Description**: Short summary
   - **Category**: Card category
   - **Difficulty**: Easy, Medium, or Hard
   - **Content**: Full HTML content for the card page

## 🔧 Configuration

### Admin Emails
Update the `ADMIN_EMAILS` array in `Scripts/home.js`:
```javascript
const ADMIN_EMAILS = ['admin1@example.com', 'admin2@example.com'];
```

### Firebase Config
The Firebase configuration is obfuscated in the code. To update it:
1. Get your Firebase config from Firebase Console
2. Update the `firebaseConfig` object in `Scripts/home.js` and `guide/index.html`

## 🎨 Customization

### Colors
Edit CSS variables in `Styles/home.css`:
```css
:root {
  --primary: #6366f1;
  --secondary: #8b5cf6;
  --success: #10b981;
  --danger: #ef4444;
  /* ... more variables */
}
```

### Fonts
Update font imports in HTML files to use different Arabic fonts.

## 🐛 Troubleshooting

### "No data" message appears
- **Solution**: The app now shows a loading spinner while fetching data. If you still see "no data":
  - Check your internet connection
  - Verify Firebase configuration
  - Check browser console for errors
  - Refresh the page

### Firebase Permission Errors
- Ensure Firestore security rules allow read access
- Verify admin emails are correctly configured
- Check that authentication is properly set up

### Loading Issues
- Clear browser cache
- Check browser console for JavaScript errors
- Verify all Firebase SDK scripts are loading correctly

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is part of the Qimma Hackathon. Please check the hackathon guidelines for usage and distribution terms.

## 👥 Authors

- Developed as part of Qimma Hackathon
- Contributors welcome!

## 🙏 Acknowledgments

- Firebase for backend services
- Google Fonts for Arabic typography
- Highlight.js for code syntax highlighting
- The competitive programming community for inspiration

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

**Note**: This project is designed primarily for Arabic-speaking users but can be adapted for other languages. The UI supports RTL (Right-to-Left) layout and Arabic text rendering.
