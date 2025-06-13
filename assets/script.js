// Funciones básicas para la interacción
function accessModule(module) {
  alert(`Accediendo al módulo de ${module}. Esta funcionalidad estará disponible pronto.`)
}

function login() {
  alert("La funcionalidad de inicio de sesión estará disponible pronto.")
}

// Animación simple para los elementos de la página
document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll(".module-card, .status-card, .login-section")

  elements.forEach((element, index) => {
    setTimeout(() => {
      element.style.opacity = "0"
      element.style.transform = "translateY(20px)"
      element.style.transition = "opacity 0.5s ease, transform 0.5s ease"

      setTimeout(() => {
        element.style.opacity = "1"
        element.style.transform = "translateY(0)"
      }, 100)
    }, index * 200)
  })
})

// Mostrar fecha actual
document.addEventListener("DOMContentLoaded", () => {
  const versionElement = document.querySelector(".version")
  const currentDate = new Date()
  const formattedDate = currentDate.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  versionElement.textContent = `Versión 1.3.1 - ${formattedDate}`
})

document.addEventListener("DOMContentLoaded", () => {
  console.log("Página de mantenimiento cargada correctamente")
})
