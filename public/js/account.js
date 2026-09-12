(function () {
  "use strict";
  var locale = (window.__APP__ && window.__APP__.locale) || "en";

  var nameForm = document.getElementById("name-form");
  var nameNote = document.getElementById("name-note");
  nameForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var name = nameForm.querySelector("input[name=name]").value.trim();
    try {
      await window.apiFetch("/api/account/name", { method: "POST", body: JSON.stringify({ name: name }) });
      nameNote.textContent = locale === "ar" ? "تم الحفظ" : "Saved";
      nameNote.hidden = false;
      nameNote.classList.remove("error");
      document.querySelector(".profile-name") && (document.querySelector(".profile-name").textContent = name);
    } catch (err) {
      nameNote.textContent = err.message;
      nameNote.hidden = false;
      nameNote.classList.add("error");
    }
  });

  var showPhoneChangeBtn = document.getElementById("show-phone-change");
  var requestForm = document.getElementById("phone-request-form");
  var confirmForm = document.getElementById("phone-confirm-form");
  var phoneNote = document.getElementById("phone-note");
  var pendingNewPhone = "";

  showPhoneChangeBtn.addEventListener("click", function () {
    requestForm.hidden = false;
    showPhoneChangeBtn.hidden = true;
  });

  requestForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    phoneNote.hidden = true;
    var newPhone = requestForm.querySelector("input[name=newPhone]").value.trim();
    var submitBtn = requestForm.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    try {
      var result = await window.apiFetch("/api/account/phone/request", {
        method: "POST",
        body: JSON.stringify({ newPhone: newPhone }),
      });
      pendingNewPhone = result.newPhone;
      requestForm.hidden = true;
      confirmForm.hidden = false;
    } catch (err) {
      phoneNote.textContent = err.message;
      phoneNote.hidden = false;
      phoneNote.classList.add("error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  confirmForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    phoneNote.hidden = true;
    var code = confirmForm.querySelector("input[name=code]").value.trim();
    var submitBtn = confirmForm.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    try {
      await window.apiFetch("/api/account/phone/confirm", {
        method: "POST",
        body: JSON.stringify({ newPhone: pendingNewPhone, code: code }),
      });
      location.reload();
    } catch (err) {
      phoneNote.textContent = err.message;
      phoneNote.hidden = false;
      phoneNote.classList.add("error");
      submitBtn.disabled = false;
    }
  });
})();
