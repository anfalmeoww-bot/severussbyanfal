(function () {
  "use strict";
  var locale = (window.__APP__ && window.__APP__.locale) || "en";
  var strings = {
    ar: { edit: "تعديل", delete: "حذف", empty: "لا توجد منتجات بعد.", confirmDelete: "هل تريد حذف هذا المنتج؟", active: "منشور", hidden: "مخفي" },
    en: { edit: "Edit", delete: "Delete", empty: "No products yet.", confirmDelete: "Delete this product?", active: "Active", hidden: "Hidden" },
  };
  var S = strings[locale];
  var listEl = document.getElementById("products-list");

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(cents, currency) {
    var amount = (cents / 100).toFixed(2);
    return currency === "SAR" ? (locale === "ar" ? amount + " ر.س" : "SAR " + amount) : amount + " " + currency;
  }

  async function remove(id) {
    if (!confirm(S.confirmDelete)) return;
    try {
      await window.apiFetch("/api/admin/products/" + id, { method: "DELETE" });
      load();
    } catch (err) {
      window.showToast(err.message);
    }
  }

  async function load() {
    try {
      var data = await window.apiFetch("/api/admin/products");
      if (!data.products.length) {
        listEl.innerHTML = '<div class="empty-row">' + S.empty + "</div>";
        return;
      }
      var rows = data.products
        .map(function (p) {
          var img = p.images && p.images[0] ? '<img src="' + escapeHtml(p.images[0].url) + '" alt="">' : "";
          var name = locale === "ar" ? p.name_ar : p.name_en;
          return (
            "<tr>" +
            "<td>" + img + "</td>" +
            "<td>" + escapeHtml(name) + "</td>" +
            "<td>" + money(p.price_cents, p.currency) + "</td>" +
            "<td>" + p.stock + "</td>" +
            "<td>" + (p.is_active ? S.active : S.hidden) + "</td>" +
            '<td class="table-actions">' +
            '<a class="btn btn-ghost" href="/admin/products/' + p.id + '/edit">' + S.edit + "</a>" +
            '<button type="button" class="btn btn-ghost" data-delete="' + p.id + '">' + S.delete + "</button>" +
            "</td></tr>"
          );
        })
        .join("");
      listEl.innerHTML =
        '<table class="admin-table"><thead><tr><th></th><th>Name</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody>' +
        rows +
        "</tbody></table>";
      listEl.querySelectorAll("[data-delete]").forEach(function (btn) {
        btn.addEventListener("click", function () { remove(btn.getAttribute("data-delete")); });
      });
    } catch (err) {
      listEl.innerHTML = '<p class="loading-text">' + err.message + "</p>";
    }
  }

  load();
})();
