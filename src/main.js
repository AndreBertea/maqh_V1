
console.log("📡 Attaching userNotationUpdated listener...");

import { openCardModal } from "./components/cardModal/cardModal.js";
import { initGrid } from "./grid.js";
import { initSidebar } from "./sidebar.js";
import { openSettingsModal } from "./parametre.js";
import { renderEvaluationTable } from "./components/evaluation/evaluationView.js";
import { setupGlobalSearch } from "./search/index.js";
import { initUserModal } from "./modalUser.js";
import { fetchUserData } from "./storage.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
// import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Charger la config Firebase via l'API de preload (fichier ~/.maqh_config/config/firebase.json)
const firebaseConfig = (typeof window !== 'undefined' && window.firebaseConfigAPI?.getFirebaseConfig?.()) || null;
if (!firebaseConfig || !firebaseConfig.apiKey) {
  console.error("Configuration Firebase manquante. Veuillez renseigner ~/.maqh_config/config/firebase.json");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDB = db;

// initializeFirestore(app, {
//   experimentalForceLongPolling: true
// });

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Lancement de l'application");

  initSidebar();
  initGrid();
  renderEvaluationTable();
  setupScrollNavigation();
  setupSidebarNavigation();
  setupGlobalSearch();

  const settingsBtn = document.querySelector(".settings-btn");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openSettingsModal();
    });
  }

  const loginButton = document.getElementById("login");
  loginButton?.addEventListener("click", () => {
    const loginForm = document.getElementById("login-form");
    loginForm.style.display = "flex";
  });

  const submitLogin = document.getElementById("submit-login");
  submitLogin?.addEventListener("click", async () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    if (!email || !password) return alert("Champs requis");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      document.getElementById("login-form").style.display = "none";
      document.getElementById("login").style.display = "none";
      const profile = document.getElementById("user-profile");
      profile.style.display = "block";
      profile.querySelector(".user-name").innerText = user.displayName || "Utilisateur";
      profile.querySelector(".user-mail").innerText = user.email;
      await fetchUserData();
    } catch (err) {
      alert("Erreur d'authentification : " + err.message);
    }
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      document.getElementById("login").style.display = "none";
      const profile = document.getElementById("user-profile");
      profile.style.display = "block";
      profile.querySelector(".user-name").innerText = user.displayName || "Utilisateur";
      profile.querySelector(".user-mail").innerText = user.email;
    }
  });

  initUserModal(auth, fetchUserData);
  highlightSidebar(0);
});

window.addEventListener("userNotationUpdated", (e) => {
  console.log("📩 Événement userNotationUpdated reçu :", e.detail?.cardName);
});

const bc = new BroadcastChannel("user-notation-channel");
bc.onmessage = (event) => {
  const { type, cardName } = event.data || {};
  if (type === "userNotationUpdated" && cardName) {
    const lastCard = window.__lastOpenedCard;
    const overlay = document.getElementById("card-detail-overlay");
    if (!lastCard || !overlay) return;
    overlay.remove();
    const loaderOverlay = document.createElement("div");
    loaderOverlay.id = "loader-overlay";
    Object.assign(loaderOverlay.style, {
      position: "fixed", top: "0", left: "0", width: "100vw", height: "100vh",
      backgroundColor: "#000000cc", display: "flex", justifyContent: "center", alignItems: "center", zIndex: "9999"
    });
    const loader = document.createElement("div");
    loader.className = "loader";
    loader.innerHTML = `<span></span><span></span><span></span><span></span><span></span><span></span>`;
    loaderOverlay.appendChild(loader);
    document.body.appendChild(loaderOverlay);
    setTimeout(() => {
      loaderOverlay.remove();
      openCardModal(lastCard);
    }, 1000);
  }
};

function setupScrollNavigation() {
  const sections = document.querySelectorAll(".view-section");
  let currentIndex = 0;
  let isThrottled = false;
  window.addEventListener("wheel", (e) => {
    if (isThrottled) return;
    const activeSection = sections[currentIndex];
    const { scrollTop, scrollHeight, clientHeight } = activeSection;
    const atTop = scrollTop === 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight;
    const delta = e.deltaY;
    const threshold = 50;
    if (delta > threshold && atBottom && currentIndex < sections.length - 1) {
      currentIndex++;
    } else if (delta < -threshold && atTop && currentIndex > 0) {
      currentIndex--;
    } else return;
    scrollToSection(currentIndex);
    highlightSidebar(currentIndex);
    isThrottled = true;
    setTimeout(() => (isThrottled = false), 1000);
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        const index = id === "home-view" ? 0 : id === "evaluation-view" ? 1 : -1;
        if (index !== -1) highlightSidebar(index);
      }
    });
  }, {
    root: document.querySelector(".scroll-wrapper"),
    threshold: 0.6,
  });
  sections.forEach(section => observer.observe(section));
}

function scrollToSection(index) {
  const target = document.querySelectorAll(".view-section")[index];
  if (target) {
    target.scrollIntoView({ behavior: "smooth" });
  }
}

function setupSidebarNavigation() {
  const sidebarLinks = document.querySelectorAll(".sidebar nav a");
  sidebarLinks.forEach((link, index) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToSection(index);
      highlightSidebar(index);
    });
  });
}

function highlightSidebar(index) {
  const links = document.querySelectorAll(".sidebar nav a");
  links.forEach((link, i) => {
    link.classList.toggle("active", i === index);
  });
}
