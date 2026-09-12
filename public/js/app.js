(function () {
  "use strict";

  var APP = window.__APP__ || {};

  window.apiFetch = async function apiFetch(url, options) {
    options = options || {};
    var headers = Object.assign({}, options.headers || {});
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    if (APP.csrfToken) headers["X-CSRF-Token"] = APP.csrfToken;
    var res = await fetch(url, Object.assign({}, options, { headers: headers, credentials: "same-origin" }));
    var data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
    if (!res.ok) {
      var message = (data && data.error) || "Something went wrong. Please try again.";
      throw new Error(message);
    }
    return data;
  };

  function setCartBadge(count) {
    var badge = document.getElementById("cart-badge");
    if (!badge) return;
    if (count > 0) {
      badge.textContent = String(count);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }
  window.setCartBadge = setCartBadge;

  function showToast(message) {
    var el = document.createElement("div");
    el.textContent = message;
    el.style.position = "fixed";
    el.style.bottom = "24px";
    el.style.left = "50%";
    el.style.transform = "translateX(-50%)";
    el.style.background = "var(--text)";
    el.style.color = "var(--surface)";
    el.style.padding = "0.7em 1.3em";
    el.style.borderRadius = "999px";
    el.style.boxShadow = "var(--shadow-lg)";
    el.style.zIndex = "500";
    el.style.fontSize = "0.9rem";
    document.body.appendChild(el);
    setTimeout(function () {
      el.style.transition = "opacity 0.3s ease";
      el.style.opacity = "0";
      setTimeout(function () { el.remove(); }, 300);
    }, 1600);
  }
  window.showToast = showToast;

  document.addEventListener("DOMContentLoaded", function () {
    // Profile dropdown toggle
    var trigger = document.getElementById("profile-trigger");
    var dropdown = document.getElementById("profile-dropdown");
    if (trigger && dropdown) {
      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        var isHidden = dropdown.hidden;
        dropdown.hidden = !isHidden;
        trigger.setAttribute("aria-expanded", String(isHidden));
      });
      document.addEventListener("click", function (e) {
        if (!dropdown.hidden && !dropdown.contains(e.target) && e.target !== trigger) {
          dropdown.hidden = true;
        }
      });
    }

    // Theme switch
    document.querySelectorAll(".theme-opt").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        var theme = btn.getAttribute("data-theme-choice");
        try {
          await window.apiFetch("/api/account/theme", { method: "POST", body: JSON.stringify({ theme: theme }) });
          document.documentElement.setAttribute("data-theme", theme);
          location.reload();
        } catch (err) {
          window.showToast(err.message);
        }
      });
    });

    // Logout
    var logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async function () {
        try {
          await window.apiFetch("/api/auth/logout", { method: "POST" });
          location.href = "/login";
        } catch (err) {
          window.showToast(err.message);
        }
      });
    }

    // Add-to-cart buttons on product grid cards
    document.querySelectorAll("[data-add-to-cart]").forEach(function (btn) {
      btn.addEventListener("click", async function (e) {
        e.preventDefault();
        e.stopPropagation();
        var productId = btn.getAttribute("data-product-id");
        try {
          var result = await window.apiFetch("/api/cart", {
            method: "POST",
            body: JSON.stringify({ productId: productId, quantity: 1 }),
          });
          window.setCartBadge(result.cartCount);
          window.showToast((APP.locale === "ar") ? "أُضيف إلى السلة" : "Added to cart");
        } catch (err) {
          window.showToast(err.message);
        }
      });
    });

    // Add-to-cart on product detail page (with quantity selector)
    var detailAddBtn = document.getElementById("detail-add-cart");
    if (detailAddBtn) {
      detailAddBtn.addEventListener("click", async function () {
        var productId = detailAddBtn.getAttribute("data-product-id");
        var qtyInput = document.getElementById("qty-input");
        var quantity = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
        try {
          var result = await window.apiFetch("/api/cart", {
            method: "POST",
            body: JSON.stringify({ productId: productId, quantity: quantity }),
          });
          window.setCartBadge(result.cartCount);
          window.showToast((APP.locale === "ar") ? "أُضيف إلى السلة" : "Added to cart");
        } catch (err) {
          window.showToast(err.message);
        }
      });
    }

    // Product gallery thumbnails
    document.querySelectorAll(".gallery-thumb").forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        var src = thumb.getAttribute("data-src");
        var main = document.getElementById("gallery-main-img");
        if (main) main.src = src;
        document.querySelectorAll(".gallery-thumb").forEach(function (t) { t.classList.remove("active"); });
        thumb.classList.add("active");
      });
    });
  });
})();
