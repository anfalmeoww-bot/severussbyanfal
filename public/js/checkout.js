(function () {
  "use strict";
  var btn = document.getElementById("mock-pay-btn");
  if (!btn) return;
  btn.addEventListener("click", async function () {
    btn.disabled = true;
    var orderId = btn.getAttribute("data-order-id");
    try {
      await window.apiFetch("/api/orders/" + orderId + "/mock-pay", { method: "POST" });
      location.href = "/orders/" + orderId + "/complete";
    } catch (err) {
      window.showToast(err.message);
      btn.disabled = false;
    }
  });
})();
