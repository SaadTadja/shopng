// app.js — comportements ShopNG

// Le panier : chaque entrée est un objet { name, price }
const cart = [];

// Ajoute un article au panier et met à jour l'affichage
function addToCart(name, price) {
  cart.push({ name, price });
  console.log(`Panier: ${cart.length} article(s)`);
  updateCartCount();
}

// Met à jour le compteur affiché dans la navbar
function updateCartCount() {
  const badge = document.getElementById("cart-count");
  if (badge) {
    badge.textContent = cart.length;
  }
}

// Total du panier, en MAD
function cartTotal() {
  return cart.reduce((sum, item) => sum + item.price, 0);
}

// Branche tous les boutons "Ajouter au panier".
// On lit le nom et le prix depuis les attributs data-* de chaque bouton.
document.querySelectorAll(".btn").forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.dataset.name;
    const price = Number(button.dataset.price);
    addToCart(name, price);
    console.log(`Total: ${cartTotal()} MAD`);
  });
});

console.log("ShopNG chargé ✓");
