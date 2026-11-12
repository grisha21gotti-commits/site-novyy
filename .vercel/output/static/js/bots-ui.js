/* Плавающая панель: вкладки «Консультант» и «Запрос КП». */
(function () {
  var consultant = window.BVS_CONSULTANT;
  if (!consultant || !window.BVS_KP) return;

  var root = document.createElement("div");
  root.className = "bots";
  var fab = document.createElement("button");
  fab.className = "bots-fab";
  fab.type = "button";
  fab.textContent = "Написать нам";
  fab.setAttribute("aria-expanded", "false");
  fab.setAttribute("aria-controls", "bots-panel");

  var panel = document.createElement("section");
  panel.className = "bots-panel";
  panel.id = "bots-panel";
  panel.setAttribute("aria-label", "Сообщения Бурводстрой");
  panel.hidden = true;

  var top = document.createElement("div");
  top.className = "bots-top";
  var tabs = document.createElement("div");
  tabs.className = "bots-tabs";
  tabs.setAttribute("role", "tablist");
  var tabC = document.createElement("button");
  tabC.type = "button";
  tabC.id = "tab-consultant";
  tabC.textContent = "Консультант";
  tabC.setAttribute("role", "tab");
  tabC.setAttribute("aria-selected", "true");
  tabC.setAttribute("aria-controls", "bots-consultant");
  var tabK = document.createElement("button");
  tabK.type = "button";
  tabK.id = "tab-kp";
  tabK.textContent = "Запрос КП";
  tabK.setAttribute("role", "tab");
  tabK.setAttribute("aria-selected", "false");
  tabK.setAttribute("aria-controls", "bots-kp");
  var close = document.createElement("button");
  close.type = "button";
  close.className = "bots-close";
  close.setAttribute("aria-label", "Закрыть");
  close.textContent = "×";
  tabs.appendChild(tabC);
  tabs.appendChild(tabK);
  top.appendChild(tabs);
  top.appendChild(close);

  var bodyC = document.createElement("div");
  bodyC.className = "bots-body";
  bodyC.id = "bots-consultant";
  bodyC.setAttribute("role", "tabpanel");
  var log = document.createElement("div");
  log.className = "bots-log";
  var hello = document.createElement("div");
  hello.className = "msg msg-bot";
  hello.textContent = consultant.greeting;
  log.appendChild(hello);
  var quick = document.createElement("div");
  quick.className = "quick";
  var form = document.createElement("form");
  form.className = "bots-form";
  var input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Ваш вопрос";
  input.setAttribute("aria-label", "Вопрос консультанту");
  var send = document.createElement("button");
  send.className = "btn btn-primary";
  send.type = "submit";
  send.textContent = "Спросить";
  form.appendChild(input);
  form.appendChild(send);

  function push(cls, text) {
    var m = document.createElement("div");
    m.className = "msg " + cls;
    m.textContent = text;
    log.appendChild(m);
    bodyC.scrollTop = bodyC.scrollHeight;
  }

  function ask(text) {
    var q = String(text || "").trim();
    if (!q) return;
    push("msg-user", q);
    var answer = consultant.reply(q);
    push("msg-bot", answer);
  }

  consultant.suggestions.forEach(function (label) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", function () { ask(label); });
    quick.appendChild(b);
  });
  var toKp = document.createElement("button");
  toKp.type = "button";
  toKp.textContent = "Запросить КП";
  toKp.addEventListener("click", function () { openTab("kp"); });
  quick.appendChild(toKp);

  bodyC.appendChild(log);
  bodyC.appendChild(quick);
  bodyC.appendChild(form);

  var note = document.createElement("p");
  note.className = "bots-note";
  note.id = "bots-note";
  note.textContent = "Отвечаю по материалам сайта, цены не называю — их дадим в коммерческом предложении.";

  var bodyK = document.createElement("div");
  bodyK.className = "bots-body";
  bodyK.id = "bots-kp";
  bodyK.hidden = true;
  bodyK.setAttribute("role", "tabpanel");
  var place = document.body.getAttribute("data-place") || "";
  window.BVS_KP.create(bodyK, { place: place });

  panel.appendChild(top);
  panel.appendChild(bodyC);
  panel.appendChild(note);
  panel.appendChild(bodyK);
  root.appendChild(panel);
  root.appendChild(fab);
  document.body.appendChild(root);

  function openPanel() {
    panel.hidden = false;
    panel.classList.add("is-open");
    fab.setAttribute("aria-expanded", "true");
    fab.hidden = true;
  }
  function closePanel() {
    panel.classList.remove("is-open");
    panel.hidden = true;
    fab.hidden = false;
    fab.setAttribute("aria-expanded", "false");
  }
  function focusLauncher() {
    if (fab.hidden) return;
    var style = window.getComputedStyle(fab);
    if (style.visibility === "hidden" || style.display === "none") return;
    fab.focus();
  }
  function openTab(name) {
    openPanel();
    var consult = name !== "kp";
    tabC.setAttribute("aria-selected", consult ? "true" : "false");
    tabK.setAttribute("aria-selected", consult ? "false" : "true");
    bodyC.hidden = !consult;
    bodyK.hidden = consult;
    note.textContent = consult
      ? "Отвечаю по материалам сайта, цены не называю — их дадим в коммерческом предложении."
      : "Бот собирает заявку и не считает стоимость. Отправка откроет письмо или мессенджер, это не отправка на сервер.";
    if (consult) input.focus();
  }

  fab.addEventListener("click", function () { openTab("consultant"); });
  close.addEventListener("click", function () {
    closePanel();
    focusLauncher();
  });
  tabC.addEventListener("click", function () { openTab("consultant"); });
  tabK.addEventListener("click", function () { openTab("kp"); });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    ask(input.value);
    input.value = "";
  });

  document.querySelectorAll(".js-open-kp").forEach(function (node) {
    node.addEventListener("click", function (event) {
      event.preventDefault();
      openTab("kp");
    });
  });

  window.BVS_BOTS = {
    close: closePanel,
    isOpen: function () { return !panel.hidden; },
    focusLauncher: focusLauncher,
    openKp: function () { openTab("kp"); }
  };
})();
