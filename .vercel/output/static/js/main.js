/* Меню, клавиатура, заглушка Метрики.
   BASE_URL: [ЗАПОЛНИТЬ: боевой домен, например https://bvs68.ru]
   Счётчик не загружается, пока строка ниже пустая. Не подставляйте выдуманный номер. */
(function () {
  // [ЗАПОЛНИТЬ: номер счётчика]
  var YANDEX_METRIKA_ID = "";

  /* Куда вставить стандартный код Яндекс Метрики, когда номер будет известен:
     в этот файл, внутрь блока if (YANDEX_METRIKA_ID) ниже, обычным сниппетом Метрики.
     Пока ID пустой, внешний скрипт не запрашивается. */

  var burger = document.querySelector("[data-burger]");
  var nav = document.querySelector("[data-nav]");

  function isShown(el) {
    return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  }

  function closeDrops(except) {
    document.querySelectorAll("[data-drop].is-open").forEach(function (drop) {
      if (except && drop === except) return;
      drop.classList.remove("is-open");
      var btn = drop.querySelector("[data-drop-btn]");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }

  function closeNav(opts) {
    opts = opts || {};
    if (!burger || !nav) return;
    var was = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    closeDrops();
    if (was && opts.focus && isShown(burger)) burger.focus();
  }

  function openNav() {
    if (!burger || !nav) return;
    burger.setAttribute("aria-expanded", "true");
    nav.classList.add("is-open");
    document.body.classList.add("nav-open");
    var first = nav.querySelector("a, button");
    if (first) first.focus();
  }

  function navOpen() {
    return !!(burger && burger.getAttribute("aria-expanded") === "true");
  }

  function navFocusables() {
    var items = [];
    if (isShown(burger)) items.push(burger);
    if (!nav) return items;
    nav.querySelectorAll("a, button").forEach(function (el) {
      if (isShown(el)) items.push(el);
    });
    return items;
  }

  if (burger && nav) {
    burger.addEventListener("click", function () {
      if (navOpen()) closeNav();
      else openNav();
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { closeNav(); });
    });
  }

  document.querySelectorAll("[data-drop]").forEach(function (drop) {
    var btn = drop.querySelector("[data-drop-btn]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var open = drop.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) closeDrops(drop);
    });
  });

  document.addEventListener("click", function (event) {
    var target = event.target;
    if (burger && nav && navOpen() && !burger.contains(target) && !nav.contains(target)) {
      closeNav();
    }
    document.querySelectorAll("[data-drop].is-open").forEach(function (drop) {
      if (!drop.contains(target)) {
        drop.classList.remove("is-open");
        var btn = drop.querySelector("[data-drop-btn]");
        if (btn) btn.setAttribute("aria-expanded", "false");
      }
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Tab" && navOpen()) {
      var items = navFocusables();
      if (!items.length) return;
      var current = document.activeElement;
      var index = items.indexOf(current);
      if (event.shiftKey) {
        if (index <= 0) {
          event.preventDefault();
          items[items.length - 1].focus();
        }
      } else if (index === items.length - 1 || index === -1) {
        event.preventDefault();
        items[index === -1 ? 0 : 0].focus();
      }
      return;
    }
    if (event.key !== "Escape") return;
    if (window.BVS_BOTS && typeof window.BVS_BOTS.isOpen === "function" && window.BVS_BOTS.isOpen()) {
      window.BVS_BOTS.close();
      if (typeof window.BVS_BOTS.focusLauncher === "function") window.BVS_BOTS.focusLauncher();
      return;
    }
    var openDrop = document.querySelector("[data-drop].is-open");
    if (openDrop) {
      openDrop.classList.remove("is-open");
      var dropBtn = openDrop.querySelector("[data-drop-btn]");
      if (dropBtn) {
        dropBtn.setAttribute("aria-expanded", "false");
        dropBtn.focus();
      }
      return;
    }
    if (navOpen()) closeNav({ focus: true });
  });

  function syncChrome() {
    var root = document.documentElement;
    var narrow = window.matchMedia("(max-width: 719px)").matches;
    var bar = document.querySelector(".header-contacts");
    if (bar && narrow && isShown(bar)) {
      root.style.setProperty("--dock-space", Math.ceil(bar.getBoundingClientRect().height) + "px");
    } else {
      root.style.removeProperty("--dock-space");
    }
    var form = document.querySelector("form.js-kp-form");
    var block = false;
    if (form) {
      var rect = form.getBoundingClientRect();
      if (narrow) {
        block = rect.top < window.innerHeight - 8 && rect.bottom > 64;
      } else {
        var fab = document.querySelector(".bots-fab");
        if (fab && !fab.hidden) {
          var fabRect = fab.getBoundingClientRect();
          block = rect.left < fabRect.right + 8 && rect.right > fabRect.left - 8 && rect.top < fabRect.bottom + 8 && rect.bottom > fabRect.top - 8;
        }
      }
    }
    document.body.classList.toggle("form-clear", block);
  }

  window.addEventListener("scroll", syncChrome, { passive: true });
  window.addEventListener("resize", syncChrome);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncChrome);
  } else {
    syncChrome();
  }
  window.setTimeout(syncChrome, 300);

  if (YANDEX_METRIKA_ID) {
    var s = document.createElement("script");
    s.src = "https://mc.yandex.ru/metrika/tag.js";
    s.async = true;
    s.onload = function () {
      if (window.ym) window.ym(Number(YANDEX_METRIKA_ID), "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true });
    };
    document.head.appendChild(s);
  }
})();
