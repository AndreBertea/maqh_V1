// src/sidebar.js
export function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  const resizer = document.getElementById("resizer");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  let isResizing = false;

  resizer.addEventListener("mousedown", function (e) {
    isResizing = true;
    document.body.style.cursor = "ew-resize";
    e.preventDefault();
    console.log("Début du redimensionnement");
  });

  document.addEventListener("mousemove", function (e) {
    if (!isResizing) return;
    let newWidth = e.clientX; // Position horizontale de la souris
    newWidth = Math.min(Math.max(newWidth, 0), 400);
    sidebar.style.width = newWidth + "px";
    if (newWidth < 40) {
      sidebar.style.width = "0px";
      sidebar.style.display = "none";
      sidebarToggle.style.display = "block";
      isResizing = false;
      document.body.style.cursor = "default";
      console.log("Sidebar masquée");
    }
  });

  document.addEventListener("mouseup", function () {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = "default";
      console.log("Fin du redimensionnement");
    }
  });

  sidebarToggle.addEventListener("click", function () {
    sidebar.style.display = "flex";
    sidebar.style.width = "250px";
    sidebarToggle.style.display = "none";
    console.log("Sidebar affichée");
  });
}
