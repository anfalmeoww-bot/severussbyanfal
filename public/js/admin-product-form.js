(function () {
  "use strict";
  var form = document.getElementById("product-form");
  var errorEl = document.getElementById("product-form-error");
  var fileInput = document.getElementById("image-file-input");
  var thumbGrid = document.getElementById("image-thumb-grid");
  var productId = form.getAttribute("data-product-id") || "";
  var pendingNewImages = []; // data URLs staged before the product exists yet

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function addThumb(url, imageId) {
    var div = document.createElement("div");
    div.className = "image-thumb";
    if (imageId) div.setAttribute("data-image-id", imageId);
    div.innerHTML = '<img src="' + url + '" alt="">' + '<button type="button" class="image-remove">✕</button>';
    div.querySelector(".image-remove").addEventListener("click", async function () {
      if (imageId) {
        try {
          await window.apiFetch("/api/admin/images/" + imageId, { method: "DELETE" });
        } catch (err) {
          window.showToast(err.message);
          return;
        }
      } else {
        var idx = pendingNewImages.indexOf(url);
        if (idx >= 0) pendingNewImages.splice(idx, 1);
      }
      div.remove();
    });
    thumbGrid.appendChild(div);
  }

  fileInput.addEventListener("change", async function () {
    var files = Array.from(fileInput.files || []);
    for (var i = 0; i < files.length; i++) {
      var dataUrl = await readFileAsDataUrl(files[i]);
      if (productId) {
        try {
          var result = await window.apiFetch("/api/admin/products/" + productId + "/images", {
            method: "POST",
            body: JSON.stringify({ image: dataUrl }),
          });
          addThumb(dataUrl, result.image.id);
        } catch (err) {
          window.showToast(err.message);
        }
      } else {
        pendingNewImages.push(dataUrl);
        addThumb(dataUrl, null);
      }
    }
    fileInput.value = "";
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorEl.hidden = true;
    var submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    var fd = new FormData(form);
    var payload = {
      nameEn: fd.get("nameEn"),
      nameAr: fd.get("nameAr"),
      descriptionEn: fd.get("descriptionEn"),
      descriptionAr: fd.get("descriptionAr"),
      priceCents: Math.round(parseFloat(fd.get("price") || "0") * 100),
      stock: parseInt(fd.get("stock") || "0", 10),
      categoryId: fd.get("categoryId") || null,
      isActive: fd.get("isActive") === "on",
    };
    if (!productId) payload.images = pendingNewImages;

    try {
      if (productId) {
        await window.apiFetch("/api/admin/products/" + productId, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await window.apiFetch("/api/admin/products", { method: "POST", body: JSON.stringify(payload) });
      }
      location.href = "/admin/products";
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
      submitBtn.disabled = false;
    }
  });

  // Wire up delete buttons on server-rendered existing images (edit mode).
  thumbGrid.querySelectorAll("[data-remove-image]").forEach(function (btn) {
    btn.addEventListener("click", async function () {
      var imageId = btn.getAttribute("data-remove-image");
      try {
        await window.apiFetch("/api/admin/images/" + imageId, { method: "DELETE" });
        btn.closest(".image-thumb").remove();
      } catch (err) {
        window.showToast(err.message);
      }
    });
  });
})();
