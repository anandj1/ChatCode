# CodeChat  
**A Next-Generation Real-Time Collaborative Coding Platform**

![CodeChat Logo](https://github.com/anandj1/ChatCode/blob/main/public/favicon.png)  


---

## 📌 Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Introduction

Welcome to **CodeChat** – the ultimate real-time collaborative coding platform designed for developers, interviewers, and teams. Whether you’re working remotely, pair programming, or hosting technical interviews, CodeChat brings all your collaboration needs into one seamless, secure experience.

**Why CodeChat?**  
- **Real-Time Collaboration:** Instant code synchronization with live editing, syntax highlighting, and smart autocompletion.
- **Private & Secure Rooms:** Create password-protected sessions for exclusive, confidential coding.
- **Integrated Communication:** Enjoy HD video calls and a markdown-enabled chat for rich, interactive discussions.
- **Modern Authentication:** Sign in effortlessly using Google or GitHub OAuth.
- **Mobile-Responsive:** Experience a smooth, adaptive interface across desktops, tablets, and smartphones.

---

## Features

- **💻 Real-Time Code Collaboration:**  
  Every keystroke syncs immediately with advanced syntax highlighting and autocompletion.

- **🔒 Private & Secure Rooms:**  
  Create exclusive, password-protected sessions for team meetings, interviews, or private coding projects.

- **📹 HD Video & Rich Chat:**  
  Integrated video calls and chat with markdown support enable dynamic, on-the-fly communication.

- **🔑 Google & GitHub Authentication:**  
  Modern OAuth sign-in for secure, hassle-free access.

- **📱 Fully Mobile Responsive:**  
  Designed with a mobile-first approach, ensuring a consistent experience on any device.

- **⚙️ Robust Backend & Real-Time APIs:**  
  Powered by a custom Node.js API and Socket.io, delivering low-latency, real-time collaboration.

- **🛡️ Enhanced Security & Scalability:**  
  Utilizes JWT for session management, encrypted communication, and optimized database indexing.

- **🚀 Streamlined DevOps & CI/CD:**  
  Automated deployments ensure high availability and smooth, zero-downtime updates.

---

## Tech Stack

### **Frontend:**
- **React with TypeScript** – For a type-safe, scalable UI.
- **Tailwind CSS & ShadcnUI** – Providing modern, responsive design.
- **Socket.io-client** – Enabling real-time communication.

### **Backend:**
- **Node.js & Express** – Fast and efficient API development.
- **Socket.io** – Powers live, low-latency updates.
- **MongoDB + Mongoose** – Robust database for storing users and room data.

### **Authentication:**
- **OAuth (Google & GitHub)** – Secure, modern authentication.
- **JWT** – For reliable session management.

### **Deployment:**
- **CI/CD Pipelines** – Automated, seamless updates.
- **Cloud-Based Hosting** – Ensures scalability and high availability.

---

## Installation

### **Prerequisites:**
- **Node.js (v14 or above)**
- **npm or yarn**
- **MongoDB instance** (local or cloud)

### **Setup:**

1. **Clone the Repository:**
   
   git clone https://github.com/anandj1/ChatCode.git
   cd ChatCode

### 2️⃣ Install dependencies
sh
Copy
Edit
npm install
# OR
yarn install
### 3️⃣ Configure Environment Variables
Create a .env file in the root directory and set your credentials:

env
Copy
Edit
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=your_frontend_url
### 4️⃣ Run the Application
sh
Copy
Edit
npm run dev
# OR
yarn dev
Your frontend and backend should now be running locally! 🎉

### 🚀 Usage
### 🌟 Create & Join Rooms – Instantly create a coding session or join an existing one.

### 💬 Chat & Video Call – Engage in discussions while collaborating in real-time.

### 🔑 Authenticate Securely – Sign in with Google/GitHub OAuth to save your work.

### 📱 Use on Any Device – Enjoy a fully mobile-responsive experience!

### 📡 Deployment
CodeChat is deployed with modern DevOps practices, ensuring:

### 🚀 High Availability – Sessions stay live even during high traffic.

### 🔄 CI/CD Automation – Fast, zero-downtime deployments.

### 📡 Scalable Architecture – Optimized for low latency & high performance.

### This ensures a smooth experience for all users, with seamless updates and high uptime.

### 🤝 Contributing
Want to improve CodeChat? Contributions are welcome! 🎉

Steps to contribute:
### 1️⃣ Fork the repository
### 2️⃣ Create a branch:

sh
Copy
Edit
git checkout -b feature/my-feature
### 3️⃣ Commit changes:

sh
Copy
Edit
git commit -m "Added new feature"
### 4️⃣ Push to branch:

sh
Copy
Edit
### git push origin feature/my-feature
### 5️⃣ Open a Pull Request 🚀

### 📜 License
This project is open-source and available under the MIT License. See the LICENSE file for details.

### 📬 Contact
💡 Have questions or want to collaborate? Reach out!

### 📧 Email: anandj12215@gmail.com
### 🔗 LinkedIn: https://www.linkedin.com/in/anandjsharma/

### ⭐ Show Your Support!
### If you find CodeChat useful, consider starring ⭐ the repository!


Happy Coding! 🚀
