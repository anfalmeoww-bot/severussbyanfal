(function () {
  "use strict";

  document.querySelectorAll("[data-qty-input]").forEach(function (input) {
    var debounceTimer;
    input.addEventListener("change", function () {
      clearTimeout(debounceTimer);
      var productId = input.getAttribute("data-product-id");
      var quantity = parseInt(input.value, 10) || 1;
      debounceTimer = setTimeout(async function () {
        try {
          var result = await window.apiFetch("/api/cart", {
            method: "POST",
            body: JSON.stringify({ productId: productId, quantity: quantity }),
          });
          window.setCartBadge(result.cartCount);
          location.reload();
        } catch (err) {
          window.showToast(err.message);
        }
      }, 250);
    });
  });

  document.querySelectorAll("[data-remove-item]").forEach(function (btn) {
    btn.addEventListener("click", async function () {
      var productId = btn.getAttribute("data-product-id");
      try {
        var result = await window.apiFetch("/api/cart/" + encodeURIComponent(productId), { method: "DELETE" });
        window.setCartBadge(result.cartCount);
        location.reload();
      } catch (err) {
        window.showToast(err.message);
      }
    });
  });

  var checkoutBtn = document.getElementById("checkout-btn");
  var modal = document.getElementById("checkout-form-modal");
  var cancelBtn = document.getElementById("checkout-cancel");
  var form = document.getElementById("checkout-form");
  var errorEl = document.getElementById("checkout-error");

  if (checkoutBtn && modal) {
    checkoutBtn.addEventListener("click", function () {
      modal.hidden = false;
    });
    cancelBtn.addEventListener("click", function () {
      modal.hidden = true;
    });
    modal.addEventListener("click", function (e) {
      if (e.target === modal) modal.hidden = true;
    });
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      errorEl.hidden = true;
      var submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true;
      var formData = new FormData(form);
      try {
        var result = await window.apiFetch("/api/checkout", {
          method: "POST",
          body: JSON.stringify({
            name: formData.get("name"),
            phone: formData.get("phone"),
            city: formData.get("city"),
            address: formData.get("address"),
          }),
        });
        location.href = "/checkout/" + result.orderId;
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
        submitBtn.disabled = false;
      }
    });
  }
})();
