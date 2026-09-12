(function () {
  "use strict";
  var locale = (window.__APP__ && window.__APP__.locale) || "en";
  var strings = {
    ar: { edit: "تعديل", delete: "حذف", empty: "لم تقم بإنشاء أي أقسام بعد.", confirmDelete: "هل تريد حذف هذا القسم؟", products: "منتج" },
    en: { edit: "Edit", delete: "Delete", empty: "You haven't created any categories yet.", confirmDelete: "Delete this category?", products: "products" },
  };
  var S = strings[locale];

  var listEl = document.getElementById("categories-list");
  var modal = document.getElementById("category-modal");
  var form = document.getElementById("category-form");
  var modalTitle = document.getElementById("category-modal-title");
  var formError = document.getElementById("category-form-error");
  var addBtn = document.getElementById("add-category-btn");
  var cancelBtn = document.getElementById("category-modal-cancel");

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function openModal(category) {
    form.reset();
    formError.hidden = true;
    if (category) {
      modalTitle.textContent = S.edit;
      form.elements.id.value = category.id;
      form.elements.nameEn.value = category.name_en;
      form.elements.nameAr.value = category.name_ar;
    } else {
      modalTitle.textContent = addBtn.textContent;
      form.elements.id.value = "";
    }
    modal.hidden = false;
  }

  addBtn.addEventListener("click", function () { openModal(null); });
  cancelBtn.addEventListener("click", function () { modal.hidden = true; });
  modal.addEventListener("click", function (e) { if (e.target === modal) modal.hidden = true; });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    formError.hidden = true;
    var id = form.elements.id.value;
    var payload = { nameEn: form.elements.nameEn.value.trim(), nameAr: form.elements.nameAr.value.trim() };
    try {
      if (id) {
        await window.apiFetch("/api/admin/categories/" + id, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await window.apiFetch("/api/admin/categories", { method: "POST", body: JSON.stringify(payload) });
      }
      modal.hidden = true;
      load();
    } catch (err) {
      formError.textContent = err.message;
      formError.hidden = false;
    }
  });

  async function remove(id) {
    if (!confirm(S.confirmDelete)) return;
    try {
      await window.apiFetch("/api/admin/categories/" + id, { method: "DELETE" });
      load();
    } catch (err) {
      window.showToast(err.message);
    }
  }

  async function load() {
    try {
      var data = await window.apiFetch("/api/admin/categories");
      if (!data.categories.length) {
        listEl.innerHTML = '<div class="empty-row">' + S.empty + "</div>";
        return;
      }
      var rows = data.categories
        .map(function (c) {
          return (
            "<tr>" +
            "<td>" + escapeHtml(c.name_en) + "</td>" +
            "<td dir=\"rtl\">" + escapeHtml(c.name_ar) + "</td>" +
            "<td>/category/" + escapeHtml(c.slug) + "</td>" +
            '<td class="table-actions">' +
            '<button type="button" class="btn btn-ghost" data-edit=\'' + JSON.stringify(c).replace(/'/g, "&#39;") + "'>" + S.edit + "</button>" +
            '<button type="button" class="btn btn-ghost" data-delete="' + c.id + '">' + S.delete + "</button>" +
            "</td></tr>"
          );
        })
        .join("");
      listEl.innerHTML =
        '<table class="admin-table"><thead><tr><th>Name (EN)</th><th>Name (AR)</th><th>URL</th><th></th></tr></thead><tbody>' +
        rows +
        "</tbody></table>";
      listEl.querySelectorAll("[data-edit]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          openModal(JSON.parse(btn.getAttribute("data-edit")));
        });
      });
      listEl.querySelectorAll("[data-delete]").forEach(function (btn) {
        btn.addEventListener("click", function () { remove(btn.getAttribute("data-delete")); });
      });
    } catch (err) {
      listEl.innerHTML = '<p class="loading-text">' + err.message + "</p>";
    }
  }

  load();
})();
