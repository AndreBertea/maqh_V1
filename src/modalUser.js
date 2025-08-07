
import { sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Initialisation et écoute sur le profil utilisateur
export function initUserModal(auth, fetchUserData) {
  const userProfile = document.getElementById("user-profile");
  const userModal = document.getElementById("user-modal");
  const modalUsername = document.getElementById("modal-username");
  const modalUseremail = document.getElementById("modal-useremail");

  userProfile?.addEventListener("click", () => {
    const user = auth.currentUser;
    if (!user) return;
    modalUsername.innerText = user.displayName || "Utilisateur";
    modalUseremail.innerText = user.email;
    userModal.style.display = "block";
  });

  document.getElementById("close-user-modal")?.addEventListener("click", () => {
    userModal.style.display = "none";
  });

  document.getElementById("update-data-btn")?.addEventListener("click", async () => {
    await fetchUserData();
    alert("✅ Données locales mises à jour !");
  });

  document.getElementById("reset-password-btn")?.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user?.email) return alert("Email introuvable.");
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert("📧 Email de réinitialisation envoyé !");
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  });

  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await signOut(auth);
    userModal.style.display = "none";
    document.getElementById("login").style.display = "block";
    document.getElementById("user-profile").style.display = "none";
    alert("👋 Déconnecté");
  });
}
