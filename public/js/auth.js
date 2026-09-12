(function () {
  "use strict";

  var phoneStep = document.getElementById("phone-step");
  var codeStep = document.getElementById("code-step");
  var phoneInput = document.getElementById("phone-input");
  var codeInput = document.getElementById("code-input");
  var phoneError = document.getElementById("phone-error");
  var codeError = document.getElementById("code-error");
  var codePhoneDisplay = document.getElementById("code-phone-display");
  var resendBtn = document.getElementById("resend-code");
  var changeNumberBtn = document.getElementById("change-number");

  var currentPhone = "";

  function showError(el, message) {
    el.textContent = message;
    el.hidden = false;
  }
  function hideError(el) {
    el.hidden = true;
  }

  async function requestCode(phone) {
    return window.apiFetch("/api/auth/request-otp", { method: "POST", body: JSON.stringify({ phone: phone }) });
  }

  phoneStep.addEventListener("submit", async function (e) {
    e.preventDefault();
    hideError(phoneError);
    var phone = phoneInput.value.trim();
    var submitBtn = phoneStep.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    try {
      var result = await requestCode(phone);
      currentPhone = result.phone;
      codePhoneDisplay.textContent = currentPhone;
      phoneStep.hidden = true;
      codeStep.hidden = false;
      codeInput.focus();
    } catch (err) {
      showError(phoneError, err.message);
    } finally {
      submitBtn.disabled = false;
    }
  });

  codeStep.addEventListener("submit", async function (e) {
    e.preventDefault();
    hideError(codeError);
    var code = codeInput.value.trim();
    var submitBtn = codeStep.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    try {
      await window.apiFetch("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone: currentPhone, code: code }),
      });
      location.href = "/";
    } catch (err) {
      showError(codeError, err.message);
    } finally {
      submitBtn.disabled = false;
    }
  });

  resendBtn.addEventListener("click", async function () {
    hideError(codeError);
    try {
      await requestCode(currentPhone);
      window.showToast(window.__APP__.locale === "ar" ? "تم إرسال رمز جديد" : "A new code was sent");
    } catch (err) {
      showError(codeError, err.message);
    }
  });

  changeNumberBtn.addEventListener("click", function () {
    codeStep.hidden = true;
    phoneStep.hidden = false;
    codeInput.value = "";
    phoneInput.focus();
  });
})();
