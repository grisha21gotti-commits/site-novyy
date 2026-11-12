/* Подставляет тексты из content/*.js в элементы с data-field и data-company.
   В HTML уже лежит тот же текст: если скрипт не выполнится, страница останется читаемой. */
(function () {
  var page = window.PAGE_CONTENT || {};
  var company = window.COMPANY || {};

  document.querySelectorAll("[data-field]").forEach(function (el) {
    var key = el.getAttribute("data-field");
    if (!key || page[key] == null) return;
    el.textContent = String(page[key]);
  });

  document.querySelectorAll("[data-company]").forEach(function (el) {
    var key = el.getAttribute("data-company");
    if (!key || company[key] == null) return;
    el.textContent = String(company[key]);
  });

  document.querySelectorAll("[data-company-href]").forEach(function (el) {
    var key = el.getAttribute("data-company-href");
    if (!key || company[key] == null) return;
    el.setAttribute("href", String(company[key]));
  });

  var re = /\[(ЗАПОЛНИТЬ|ПОДТВЕРДИТЬ):[^\]]+\]/g;
  var root = document.body;
  if (!root) return;
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function (node) {
      if (!node.parentElement) return NodeFilter.FILTER_REJECT;
      var tag = node.parentElement.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA") return NodeFilter.FILTER_REJECT;
      return /\[(ЗАПОЛНИТЬ|ПОДТВЕРДИТЬ):[^\]]+\]/.test(node.nodeValue || "")
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    }
  });
  var nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(function (node) {
    var text = node.nodeValue || "";
    re.lastIndex = 0;
    if (!re.test(text)) return;
    re.lastIndex = 0;
    var frag = document.createDocumentFragment();
    var last = 0;
    var match;
    while ((match = re.exec(text))) {
      if (match.index > last) frag.appendChild(document.createTextNode(text.slice(last, match.index)));
      var span = document.createElement("span");
      span.className = "ph";
      span.textContent = match[0];
      frag.appendChild(span);
      last = match.index + match[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    if (node.parentNode) node.parentNode.replaceChild(frag, node);
  });
})();
