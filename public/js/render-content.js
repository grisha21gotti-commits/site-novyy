/* Подставляет тексты из content/*.js в элементы с data-field и data-company.
   Пометки [ЗАПОЛНИТЬ] и [ПОДТВЕРДИТЬ] посетителю не показываются:
   скрывается абзац, пункт, строка или карточка, где они остались. */
(function () {
  var page = window.PAGE_CONTENT || {};
  var company = window.COMPANY || {};
  var mark = /\[(ЗАПОЛНИТЬ|ПОДТВЕРДИТЬ):[^\]]+\]/;

  function hasMark(value) {
    return mark.test(String(value || ""));
  }

  function hide(el) {
    if (!el || el === document.body || el === document.documentElement) return;
    el.hidden = true;
  }

  document.querySelectorAll("[data-field]").forEach(function (el) {
    var key = el.getAttribute("data-field");
    if (!key || page[key] == null) return;
    var value = String(page[key]);
    if (hasMark(value)) {
      hide(el.closest("p, li, tr, dd, figcaption") || el);
      return;
    }
    el.textContent = value;
  });

  document.querySelectorAll("[data-company]").forEach(function (el) {
    var key = el.getAttribute("data-company");
    if (!key || company[key] == null) return;
    var value = String(company[key]);
    if (!value.trim() || hasMark(value)) {
      hide(el.closest("p, li, tr, dd, figcaption") || el);
      return;
    }
    el.textContent = value;
  });

  document.querySelectorAll("[data-company-href]").forEach(function (el) {
    var key = el.getAttribute("data-company-href");
    if (!key || company[key] == null) return;
    var value = String(company[key]);
    if (!value.trim() || hasMark(value) || value === "#" || value === "tel:") {
      hide(el);
      return;
    }
    el.setAttribute("href", value);
  });

  if (company.address) {
    document.querySelectorAll("[data-map]").forEach(function (frame) {
      frame.src = "https://yandex.ru/map-widget/v1/?text=" + encodeURIComponent(company.address) + "&z=16";
      frame.title = "Карта: " + company.address;
    });
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (node) {
      if (!/"PostalAddress"/.test(node.textContent || "")) return;
      try {
        var data = JSON.parse(node.textContent);
        var postal = "392018";
        var locality = "Тамбов";
        var street = company.address;
        var parts = company.address.split(",");
        if (parts.length >= 3) {
          postal = parts[0].trim();
          locality = parts[1].replace(/^г\.\s*/, "").trim();
          street = parts.slice(2).join(",").trim();
        }
        data.address = {
          "@type": "PostalAddress",
          postalCode: postal,
          addressLocality: locality,
          streetAddress: street,
          addressCountry: "RU"
        };
        node.textContent = JSON.stringify(data);
      } catch (err) {}
    });
  }

  function markedHosts() {
    var hosts = [];
    document.querySelectorAll("body *").forEach(function (el) {
      if (el.closest("script, style, textarea")) return;
      if (!hasMark(el.textContent)) return;
      var inner = false;
      el.querySelectorAll("*").forEach(function (child) {
        if (hasMark(child.textContent)) inner = true;
      });
      if (!inner) hosts.push(el.closest("p, li, tr, dd, figcaption") || el);
    });
    return hosts;
  }

  markedHosts().forEach(hide);

  document.querySelectorAll("a, button").forEach(function (el) {
    if (el.closest("script, style")) return;
    var label = (el.textContent || "").replace(mark, "").trim();
    var href = el.getAttribute("href") || "";
    if (!label || hasMark(el.textContent) || hasMark(href)) hide(el);
  });

  document.querySelectorAll("article.card, article.icon-row, .card").forEach(function (card) {
    var clone = card.cloneNode(true);
    clone.querySelectorAll("h1, h2, h3, h4, [hidden], script").forEach(function (node) {
      node.remove();
    });
    var rest = (clone.textContent || "").replace(/\s+/g, " ").trim();
    if (!rest) hide(card);
  });
})();
