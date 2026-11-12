/* Пошаговый сбор заявки на КП. Стоимость не считает и не угадывает. */
(function () {
  var STEPS = [
    { id: "org", title: "Название организации", required: true, type: "text", placeholder: "Например, ООО «Поле»" },
    { id: "inn", title: "ИНН организации", required: false, type: "text", placeholder: "10 или 12 цифр", skip: "Пропустить" },
    {
      id: "place",
      title: "Район или населённый пункт объекта",
      required: true,
      type: "text",
      placeholder: "Где объект",
      chips: ["Тамбов", "Мичуринск", "Рассказово", "Моршанск", "Котовск", "другой"]
    },
    {
      id: "objectType",
      title: "Тип объекта",
      required: true,
      type: "chips",
      chips: ["ферма", "агрохолдинг", "промышленность", "муниципалитет", "другое"]
    },
    { id: "volume", title: "Нужный объём воды, м³/сутки", required: true, type: "text", placeholder: "Число или «пока не знаем»" },
    {
      id: "purpose",
      title: "Назначение воды",
      required: true,
      type: "chips",
      chips: ["питьевое", "технологическое", "смешанное", "пока не знаем"]
    },
    { id: "timing", title: "Желаемые сроки", required: true, type: "text", placeholder: "Например, к сезону или «не определены»" },
    {
      id: "docs",
      title: "Какие документы уже есть",
      required: true,
      type: "multi",
      chips: ["ничего", "проект", "лицензия", "паспорт", "другое"]
    },
    { id: "contact", title: "Контактное лицо", required: true, type: "text", placeholder: "Имя и должность" },
    { id: "phone", title: "Телефон", required: true, type: "phone", placeholder: "+7 (___) ___-__-__" },
    { id: "email", title: "Email", required: false, type: "text", placeholder: "Рабочая почта, можно пропустить", skip: "Пропустить" },
    { id: "consent", title: "Согласие с политикой конфиденциальности", required: true, type: "consent" }
  ];

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function create(root, options) {
    var state = {
      step: 0,
      data: {
        org: "",
        inn: "",
        place: (options && options.place) || "",
        objectType: "",
        volume: "",
        purpose: "",
        timing: "",
        docs: "",
        contact: "",
        phone: "",
        email: "",
        task: "",
        consent: false
      },
      docsSelected: {}
    };
    var view = el("div", "kp-view");
    root.appendChild(view);

    function showSummary() {
      view.textContent = "";
      view.appendChild(el("p", "msg msg-bot", "Проверьте сводку. Стоимость здесь не считается."));
      var list = document.createElement("ol");
      list.className = "summary";
      var rows = [
        ["Организация", state.data.org],
        ["ИНН", state.data.inn || "—"],
        ["Населённый пункт", state.data.place],
        ["Тип объекта", state.data.objectType],
        ["Объём, м³/сутки", state.data.volume],
        ["Назначение", state.data.purpose],
        ["Сроки", state.data.timing],
        ["Документы", state.data.docs],
        ["Контакт", state.data.contact],
        ["Телефон", state.data.phone],
        ["Email", state.data.email || "—"],
        ["Согласие", "да"]
      ];
      rows.forEach(function (row) {
        var li = document.createElement("li");
        li.textContent = row[0] + ": " + (row[1] || "—");
        list.appendChild(li);
      });
      view.appendChild(list);
      var actions = el("div", "actions");
      var fix = el("button", "btn btn-ghost", "Исправить");
      fix.type = "button";
      fix.addEventListener("click", function () {
        state.step = 0;
        render();
      });
      var send = el("button", "btn btn-primary", "Отправить запрос КП");
      send.type = "button";
      send.addEventListener("click", function () {
        if (send.disabled) return;
        var api = window.BVS_SEND;
        var text = api.buildMessage(state.data);
        send.disabled = true;
        send.textContent = "Отправляем…";
        api.deliver(text, state.data).then(function (kind) {
          send.textContent = kind === "sent" ? "Заявка отправлена" : "Отправить запрос КП";
          send.disabled = false;
          var old = view.querySelector("[data-kp-result]");
          if (old) old.remove();
          var wrap = el("div", "");
          wrap.setAttribute("data-kp-result", "1");
          wrap.appendChild(el("p", "form-status", api.channelStatus(kind)));
          var copy = document.createElement("textarea");
          copy.readOnly = true;
          copy.value = text;
          wrap.appendChild(copy);
          var call = document.createElement("a");
          call.className = "btn btn-ghost";
          call.href = "tel:+74752454917";
          call.textContent = "Позвонить +7 (4752) 45-49-17";
          wrap.appendChild(call);
          view.appendChild(wrap);
        });
      });
      actions.appendChild(fix);
      actions.appendChild(send);
      view.appendChild(actions);
    }

    function render() {
      if (state.step >= STEPS.length) {
        showSummary();
        return;
      }
      var spec = STEPS[state.step];
      view.textContent = "";
      view.appendChild(el("p", "msg msg-bot", "Шаг " + (state.step + 1) + " из " + STEPS.length + ". " + spec.title));
      var error = el("p", "field-error", "");
      var input = null;

      if (spec.type === "chips" || spec.type === "multi") {
        var box = el("div", "quick");
        spec.chips.forEach(function (chip) {
          var b = el("button", "choice", chip);
          b.type = "button";
          if (spec.type === "multi" && state.docsSelected[chip]) b.classList.add("is-on");
          if (spec.type === "chips" && state.data[spec.id] === chip) b.classList.add("is-on");
          b.addEventListener("click", function () {
            if (spec.type === "multi") {
              state.docsSelected[chip] = !state.docsSelected[chip];
              b.classList.toggle("is-on", !!state.docsSelected[chip]);
              state.data.docs = spec.chips.filter(function (name) { return state.docsSelected[name]; }).join(", ");
            } else {
              state.data[spec.id] = chip;
              render();
            }
          });
          box.appendChild(b);
        });
        view.appendChild(box);
      } else if (spec.type === "consent") {
        var label = el("label", "check-row");
        var boxIn = document.createElement("input");
        boxIn.type = "checkbox";
        boxIn.checked = !!state.data.consent;
        var span = el("span");
        span.appendChild(document.createTextNode("Согласен на обработку данных в соответствии с "));
        var link = document.createElement("a");
        var depth = document.body.getAttribute("data-depth") || "";
        link.href = depth + "privacy.html";
        link.textContent = "политикой конфиденциальности";
        span.appendChild(link);
        label.appendChild(boxIn);
        label.appendChild(span);
        view.appendChild(label);
        input = boxIn;
      } else {
        input = document.createElement("input");
        input.type = "text";
        input.placeholder = spec.placeholder || "";
        input.value = state.data[spec.id] || "";
        if (spec.type === "phone" && window.BVS_SEND) {
          input.addEventListener("input", function () {
            input.value = window.BVS_SEND.formatPhone(input.value);
          });
        }
        view.appendChild(input);
      }
      view.appendChild(error);

      var actions = el("div", "actions");
      if (state.step > 0) {
        var back = el("button", "btn btn-ghost", "Назад");
        back.type = "button";
        back.addEventListener("click", function () {
          state.step -= 1;
          render();
        });
        actions.appendChild(back);
      }
      if (spec.skip) {
        var skip = el("button", "btn btn-ghost", spec.skip);
        skip.type = "button";
        skip.addEventListener("click", function () {
          state.data[spec.id] = "";
          state.step += 1;
          render();
        });
        actions.appendChild(skip);
      }
      var next = el("button", "btn btn-primary", state.step === STEPS.length - 1 ? "К сводке" : "Далее");
      next.type = "button";
      next.addEventListener("click", function () {
        if (spec.type === "consent") {
          state.data.consent = !!(input && input.checked);
          if (!state.data.consent) {
            error.textContent = "Без согласия заявку не отправляем.";
            if (input) input.focus();
            return;
          }
        } else if (spec.type === "multi") {
          if (!state.data.docs) {
            error.textContent = "Выберите хотя бы один пункт.";
            return;
          }
        } else if (spec.type === "chips") {
          if (!state.data[spec.id]) {
            error.textContent = "Выберите вариант.";
            return;
          }
        } else if (spec.type !== "chips") {
          var value = input ? String(input.value || "").trim() : "";
          if (spec.type === "phone") {
            if (!window.BVS_SEND.phoneOk(value)) {
              error.textContent = "Введите телефон: 10 или 11 цифр.";
              input.focus();
              return;
            }
            value = window.BVS_SEND.formatPhone(value);
          }
          if (spec.id === "inn" && value && !/^\d{10}(\d{2})?$/.test(value)) {
            error.textContent = "ИНН — 10 или 12 цифр, либо пропустите шаг.";
            input.focus();
            return;
          }
          if (spec.id === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            error.textContent = "Проверьте почту или пропустите шаг.";
            input.focus();
            return;
          }
          if (spec.required && !value) {
            error.textContent = "Это поле нужно заполнить.";
            if (input) input.focus();
            return;
          }
          state.data[spec.id] = value;
        }
        state.step += 1;
        render();
      });
      actions.appendChild(next);
      view.appendChild(actions);
      if (input && spec.type !== "consent") input.focus();
    }

    render();
    return {
      reset: function () {
        state.step = 0;
        render();
      }
    };
  }

  window.BVS_KP = { create: create };
})();
