(function () {
  "use strict";
  var locale = (window.__APP__ && window.__APP__.locale) || "en";
  var statusLabels = {
    ar: { pending: "قيد الانتظار", paid: "مدفوع", failed: "فشل", cancelled: "ملغي" },
    en: { pending: "Pending", paid: "Paid", failed: "Failed", cancelled: "Cancelled" },
  };
  var strings = {
    ar: { orderWord: "الطلب", noOrders: "لم تقم بأي طلبات بعد.", total: "الإجمالي" },
    en: { orderWord: "Order", noOrders: "You haven't placed any orders yet.", total: "Total" },
  };
  var S = strings[locale];
  var L = statusLabels[locale];

  function money(cents, currency) {
    var amount = (cents / 100).toFixed(2);
    if (currency === "SAR") return locale === "ar" ? amount + " ر.س" : "SAR " + amount;
    return amount + " " + currency;
  }

  function formatDate(ts) {
    try {
      return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
        year: "numeric", month: "short", day: "numeric",
      }).format(new Date(ts));
    } catch (e) {
      return new Date(ts).toDateString();
    }
  }

  async function load() {
    var container = document.getElementById("orders-list");
    try {
      var data = await window.apiFetch("/api/orders");
      if (!data.orders.length) {
        container.innerHTML = '<div class="empty-state"><p>' + S.noOrders + "</p></div>";
        return;
      }
      container.innerHTML = data.orders
        .map(function (order) {
          return (
            '<a class="order-row" href="/orders/' + order.id + '/complete">' +
            "<span>" + S.orderWord + " #" + order.id.slice(0, 8).toUpperCase() + " · " + formatDate(order.created_at) + "</span>" +
            '<span class="status-pill status-' + order.status + '">' + L[order.status] + "</span>" +
            "<strong>" + money(order.total_cents, order.currency) + "</strong>" +
            "</a>"
          );
        })
        .join("");
    } catch (err) {
      container.innerHTML = '<p class="loading-text">' + err.message + "</p>";
    }
  }

  load();
})();
