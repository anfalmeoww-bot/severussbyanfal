(function () {
  "use strict";
  var locale = (window.__APP__ && window.__APP__.locale) || "en";
  var statusLabels = {
    ar: { pending: "قيد الانتظار", paid: "مدفوع", failed: "فشل", cancelled: "ملغي" },
    en: { pending: "Pending", paid: "Paid", failed: "Failed", cancelled: "Cancelled" },
  };
  var L = statusLabels[locale];
  var listEl = document.getElementById("admin-orders-list");

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(cents, currency) {
    var amount = (cents / 100).toFixed(2);
    return currency === "SAR" ? (locale === "ar" ? amount + " ر.س" : "SAR " + amount) : amount + " " + currency;
  }
  function formatDate(ts) {
    try {
      return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(ts));
    } catch (e) {
      return new Date(ts).toDateString();
    }
  }

  async function load() {
    try {
      var data = await window.apiFetch("/api/admin/orders");
      if (!data.orders.length) {
        listEl.innerHTML = '<div class="empty-row">No orders yet.</div>';
        return;
      }
      var rows = data.orders
        .map(function (o) {
          return (
            "<tr>" +
            '<td><a href="/admin/orders/' + o.id + '">#' + o.id.slice(0, 8).toUpperCase() + "</a></td>" +
            "<td>" + escapeHtml(o.shipping_name) + "<br><small>" + escapeHtml(o.shipping_phone) + "</small></td>" +
            "<td>" + formatDate(o.created_at) + "</td>" +
            '<td><span class="status-pill status-' + o.status + '">' + L[o.status] + "</span></td>" +
            "<td>" + money(o.total_cents, o.currency) + "</td>" +
            "</tr>"
          );
        })
        .join("");
      listEl.innerHTML =
        '<table class="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th>Total</th></tr></thead><tbody>' +
        rows +
        "</tbody></table>";
    } catch (err) {
      listEl.innerHTML = '<p class="loading-text">' + err.message + "</p>";
    }
  }

  load();
})();
