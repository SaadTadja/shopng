/* =========================================================
   ShopNG — comportements de la page
   Sommaire :
     1. État du panier        4. Rendu du panier
     2. Stockage local        5. Tiroir & notification
     3. Actions panier        6. Filtres & recherche
   ========================================================= */

/* ---------- 1. État du panier ---------- */

// Le panier : chaque entrée est un objet { name, price, qty }
const cart = [];

const STORAGE_KEY = "shopng.cart";

/* ---------- 2. Stockage local ---------- */
/* Ouverte en file://, certaines navigateurs bloquent localStorage.
   On enveloppe donc chaque accès pour ne jamais lever d'erreur en console. */

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(saved)) {
      saved.forEach((item) => {
        if (item && typeof item.name === "string" && Number.isFinite(item.price)) {
          cart.push({ name: item.name, price: item.price, qty: item.qty || 1 });
        }
      });
    }
  } catch (e) {
    // Stockage indisponible : le panier reste simplement vide au chargement.
  }
}

function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    // Stockage indisponible : on continue sans persistance.
  }
}

/* ---------- 3. Actions panier ---------- */

// Ajoute un article. S'il est déjà présent, on incrémente sa quantité.
function addToCart(name, price) {
  const existing = cart.find((item) => item.name === name);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }

  console.log(`Panier: ${cartCount()} article(s)`);
  afterCartChange();
  showToast(`« ${name} » ajouté au panier`);
}

// Fait varier la quantité d'un article ; à 0 on le retire.
function changeQty(name, delta) {
  const item = cart.find((entry) => entry.name === name);
  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    cart.splice(cart.indexOf(item), 1);
  }

  afterCartChange();
}

function clearCart() {
  cart.length = 0;
  afterCartChange();
}

// Nombre total d'articles (quantités comprises)
function cartCount() {
  return cart.reduce((total, item) => total + item.qty, 0);
}

// Montant total du panier, en MAD
function cartTotal() {
  return cart.reduce((total, item) => total + item.price * item.qty, 0);
}

// Formate un montant : 1250 → "1 250 MAD"
function formatPrice(amount) {
  return amount.toLocaleString("fr-FR") + " MAD";
}

/* ---------- 4. Rendu du panier ---------- */

const cartCountEl = document.getElementById("cart-count");
const cartItemsEl = document.getElementById("cart-items");
const cartEmptyEl = document.getElementById("cart-empty");
const cartTotalEl = document.getElementById("cart-total");

// Appelé après chaque modification : met à jour l'affichage et sauvegarde.
function afterCartChange() {
  renderCart();
  saveCart();
}

function renderCart() {
  cartCountEl.textContent = cartCount();
  cartTotalEl.textContent = formatPrice(cartTotal());

  cartEmptyEl.hidden = cart.length > 0;
  cartItemsEl.replaceChildren();

  cart.forEach((item) => {
    const li = document.createElement("li");
    li.className = "drawer-item";

    const name = document.createElement("span");
    name.className = "drawer-item-name";
    name.textContent = item.name;

    const price = document.createElement("span");
    price.className = "drawer-item-price";
    price.textContent = `${item.qty} × ${formatPrice(item.price)}`;

    const qty = document.createElement("div");
    qty.className = "qty";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.setAttribute("aria-label", `Retirer un ${item.name}`);
    minus.addEventListener("click", () => changeQty(item.name, -1));

    const count = document.createElement("span");
    count.textContent = item.qty;

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", `Ajouter un ${item.name}`);
    plus.addEventListener("click", () => changeQty(item.name, 1));

    qty.append(minus, count, plus);
    li.append(name, price, qty);
    cartItemsEl.append(li);
  });
}

/* ---------- 5. Tiroir & notification ---------- */

const drawer = document.getElementById("cart-drawer");
const overlay = document.getElementById("overlay");
const cartToggle = document.getElementById("cart-toggle");

function openDrawer() {
  drawer.hidden = false;
  overlay.hidden = false;
  cartToggle.setAttribute("aria-expanded", "true");
  document.getElementById("cart-close").focus();
}

function closeDrawer() {
  drawer.hidden = true;
  overlay.hidden = true;
  cartToggle.setAttribute("aria-expanded", "false");
}

cartToggle.addEventListener("click", openDrawer);
document.getElementById("cart-link").addEventListener("click", (event) => {
  event.preventDefault();
  openDrawer();
});
document.getElementById("cart-close").addEventListener("click", closeDrawer);
overlay.addEventListener("click", closeDrawer);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !drawer.hidden) closeDrawer();
});

document.getElementById("cart-clear").addEventListener("click", clearCart);

document.getElementById("cart-checkout").addEventListener("click", () => {
  if (cart.length === 0) {
    showToast("Votre panier est vide");
    return;
  }
  showToast(`Commande de ${formatPrice(cartTotal())} enregistrée — merci !`);
  clearCart();
  closeDrawer();
});

// Petite notification éphémère en bas de page
const toastEl = document.getElementById("toast");
let toastTimer;

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("is-visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2200);
}

/* ---------- 6. Filtres & recherche ---------- */

const cards = Array.from(document.querySelectorAll(".card"));
const chips = Array.from(document.querySelectorAll(".chip"));
const searchInput = document.getElementById("search-input");
const emptyState = document.getElementById("empty-state");

let activeFilter = "tous";

// Affiche les cartes correspondant à la catégorie ET au texte recherché.
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  let visible = 0;

  cards.forEach((card) => {
    const matchCategory = activeFilter === "tous" || card.dataset.category === activeFilter;
    const matchQuery = query === "" || card.textContent.toLowerCase().includes(query);
    const show = matchCategory && matchQuery;

    card.hidden = !show;
    if (show) visible += 1;
  });

  emptyState.hidden = visible > 0;
}

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    activeFilter = chip.dataset.filter;

    chips.forEach((other) => {
      const isActive = other === chip;
      other.classList.toggle("is-active", isActive);
      other.setAttribute("aria-pressed", String(isActive));
    });

    applyFilters();
  });
});

searchInput.addEventListener("input", applyFilters);

/* ---------- Branchement des boutons « Ajouter au panier » ---------- */

document.querySelectorAll(".card .btn").forEach((button) => {
  button.addEventListener("click", () => {
    addToCart(button.dataset.name, Number(button.dataset.price));
  });
});

/* ---------- Démarrage ---------- */

loadCart();
renderCart();
applyFilters();

console.log("ShopNG chargé ✓");
