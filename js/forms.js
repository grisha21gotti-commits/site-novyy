/* Заявка КП. Цены этот файл не считает.
   Если заполнен WhatsApp — открывается WhatsApp, иначе Telegram.
   Иначе письмо уходит через заменяемый адаптер (сейчас Web3Forms).
   «Отправлено» пишем только когда адаптер ответил ok: true.
   Если сервис недоступен, открывается черновик на публичную почту.
   Внутренний ящик приёма на сайте не показывается.
   WEB3FORMS_ACCESS_KEY — публичный ключ формы, не пароль от почты. */
(function () {
  // [ЗАПОЛНИТЬ: номер WhatsApp в формате 7XXXXXXXXXX]
  var WHATSAPP_NUMBER = "";
  // [ЗАПОЛНИТЬ: аккаунт или номер Telegram] — username без @
  var TELEGRAM_HANDLE = "";
  var PUBLIC_EMAIL = "bvs_tam@mail.ru";
  var PHONE_HUMAN = "+7 (4752) 45-49-17";

  /* Заменяемый адаптер отправки. Форма от него не зависит:
     чтобы сменить сервис, замените только этот объект. */
  var BVS_DELIVERY = {
    name: "web3forms",
    schemaVersion: "1",
    accessKey: "42427bbc-da4e-43b7-83f2-abf1b957878c",
    url: "https://api.web3forms.com/submit",
    send: function (payload) {
      var body = new FormData();
      body.append("access_key", this.accessKey);
      body.append("subject", payload.subject || "");
      body.append("from_name", payload.fromName || "");
      body.append("name", payload.name || "");
      body.append("email", payload.email || "");
      body.append("message", payload.message || "");
      body.append("botcheck", "");
      if (payload.replyto) body.append("replyto", payload.replyto);
      if (payload.requestId) body.append("request_id", payload.requestId);
      (payload.files || []).forEach(function (file) {
        body.append("attachment", file, file.name);
      });
      return fetch(this.url, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: body
      }).then(function (res) {
        return res.json().catch(function () { return {}; });
      }).then(function (answer) {
        var message = answer && answer.message ? String(answer.message) : "";
        return { ok: !!(answer && answer.success === true), message: message };
      });
    }
  };

  function digits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function formatPhone(value) {
    var d = digits(value);
    if (d.charAt(0) === "8") d = "7" + d.slice(1);
    if (d.charAt(0) === "7") d = d.slice(1);
    d = d.slice(0, 10);
    var out = "+7";
    if (d.length) out += " (" + d.slice(0, 3);
    if (d.length >= 3) out += ")";
    if (d.length > 3) out += " " + d.slice(3, 6);
    if (d.length > 6) out += "-" + d.slice(6, 8);
    if (d.length > 8) out += "-" + d.slice(8, 10);
    return out;
  }

  function phoneOk(value) {
    var d = digits(value);
    if (d.length === 11 && (d.charAt(0) === "7" || d.charAt(0) === "8")) return true;
    if (d.length === 10) return true;
    return false;
  }

  var SERVICE_LABELS = {
    burenie: "Бурение артезианских скважин",
    remont: "Ремонт и восстановление скважин",
    vzu: "Водозаборный узел под ключ",
    bashni: "Водонапорные башни",
    nasosy: "Насосное оборудование и частотное регулирование",
    voda: "Водоподготовка",
    zso: "Санитарные зоны",
    lic: "Лицензирование и проектная документация",
    consult: "Нужна консультация"
  };
  var FILE_EXT = { pdf: 1, doc: 1, docx: 1, xls: 1, xlsx: 1, jpg: 1, jpeg: 1, png: 1, zip: 1 };
  var FILE_MAX = 5 * 1024 * 1024;
  var FILE_COUNT = 2;

  function serviceLabel(value) {
    return SERVICE_LABELS[value] || value || "—";
  }

  function stamp() {
    try {
      return new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Europe/Moscow",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }).format(new Date()) + " (Москва)";
    } catch (e) {
      return new Date().toISOString();
    }
  }

  function ensureId(form) {
    if (!form.dataset.requestId) {
      form.dataset.requestId = "BVS-" + Date.now().toString(36).toUpperCase();
    }
    return form.dataset.requestId;
  }

  function buildMessage(data) {
    var lines = [
      "Запрос КП с сайта Бурводстрой",
      "schema_version: 1",
      "Номер обращения: " + (data.requestId || "—"),
      "Дата и время: " + (data.createdAt || "—"),
      "Источник: " + (data.source || "—"),
      "",
      "Организация: " + (data.org || "—"),
      "ИНН: " + (data.inn || "—"),
      "Контактное лицо: " + (data.contact || "—"),
      "Телефон: " + (data.phone || "—"),
      "Email: " + (data.email || "—"),
      "Место объекта: " + (data.place || "—"),
      "Услуга: " + serviceLabel(data.service),
      "Тип объекта: " + (data.objectType || "—"),
      "Нужный объём воды, м³/сутки: " + (data.volume || "—"),
      "Назначение воды: " + (data.purpose || "—"),
      "Проект и геология: " + (data.geology || "—"),
      "Анализ воды: " + (data.analysis || "—"),
      "Требования к результату: " + (data.resultNeed || "—"),
      "Известные параметры: " + (data.known || "—"),
      "Неисправность: " + (data.fault || "—"),
      "Состав работ: " + (data.scope || "—"),
      "Желаемые сроки: " + (data.timing || "—"),
      "Какие документы уже есть: " + (data.docs || "—"),
      "Задача / ТЗ: " + (data.task || "—"),
      "Вложения: " + ((data.fileNames && data.fileNames.length) ? data.fileNames.join(", ") : "нет"),
      "",
      "Согласие с политикой конфиденциальности: да"
    ];
    return lines.join("\n");
  }

  function channelStatus(kind, requestId, detail) {
    var id = requestId ? " Номер обращения: " + requestId + "." : "";
    if (kind === "sent") {
      return "Заявка отправлена." + id + " Письмо приходит на почту, которая указана в кабинете Web3Forms у этого ключа, а не на адрес с сайта. Проверьте «Спам» и вкладку «Промоакции».";
    }
    if (kind === "whatsapp") {
      return "Мы открыли WhatsApp со сводкой заявки. Если окно не появилось, позвоните " + PHONE_HUMAN + " или напишите на " + PUBLIC_EMAIL + ".";
    }
    if (kind === "telegram") {
      return "Мы открыли Telegram со сводкой заявки. Если окно не появилось, позвоните " + PHONE_HUMAN + " или напишите на " + PUBLIC_EMAIL + ".";
    }
    return "Письмо не ушло: сервис не принял заявку." + (detail ? " " + detail : "") + " Это не отправка. Текст заявки сохранён ниже." + id;
  }

  function mailtoDraft(text) {
    var subject = "Запрос КП с сайта Бурводстрой";
    window.location.href = "mailto:" + PUBLIC_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
  }

  function openMessenger(text) {
    if (WHATSAPP_NUMBER) {
      window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text), "_blank", "noopener");
      return "whatsapp";
    }
    if (TELEGRAM_HANDLE) {
      window.open("https://t.me/" + TELEGRAM_HANDLE + "?text=" + encodeURIComponent(text), "_blank", "noopener");
      return "telegram";
    }
    return "";
  }

  function deliver(text, data) {
    var messenger = openMessenger(text);
    if (messenger) return Promise.resolve(messenger);
    var subject = "Запрос КП с сайта Бурводстрой";
    if (data && data.org) subject += " — " + String(data.org).slice(0, 80);
    if (data && data.requestId) subject = "[" + data.requestId + "] " + subject;
    var visitorEmail = data && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || "") ? data.email : "";
    var payload = {
      subject: subject,
      fromName: (data && (data.contact || data.org)) || "Сайт Бурводстрой",
      name: (data && data.contact) || "Заявка с сайта",
      email: visitorEmail || PUBLIC_EMAIL,
      replyto: visitorEmail || "",
      message: text,
      requestId: data && data.requestId,
      files: data && data.files
    };
    return BVS_DELIVERY.send(payload).then(function (result) {
      if (result && result.ok) return { kind: "sent" };
      return { kind: "failed", detail: result && result.message };
    }).catch(function () {
      return { kind: "failed", detail: "Нет связи с сервисом отправки." };
    });
  }

  function openChannel(text) {
    var messenger = openMessenger(text);
    if (messenger) return messenger;
    mailtoDraft(text);
    return "email";
  }

  function setError(form, name, message) {
    var field = form.querySelector('[data-error-for="' + name + '"]');
    var input = form.querySelector('[name="' + name + '"]');
    if (field) field.textContent = message || "";
    if (input) {
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }
  }

  function readForm(form) {
    function val(name) {
      var nodes = form.querySelectorAll('[name="' + name + '"]');
      for (var i = 0; i < nodes.length; i++) {
        var extra = nodes[i].closest("[data-extra]");
        if (extra && extra.hidden) continue;
        return String(nodes[i].value || "").trim();
      }
      return "";
    }
    var consent = form.querySelector('[name="consent"]');
    return {
      org: val("org"),
      inn: val("inn"),
      contact: val("contact"),
      phone: val("phone"),
      email: val("email"),
      place: val("place"),
      objectType: val("objectType"),
      volume: val("volume"),
      purpose: val("purpose"),
      timing: val("timing"),
      docs: val("docs"),
      task: val("task"),
      service: val("service"),
      geology: val("geology"),
      analysis: val("analysis"),
      resultNeed: val("resultNeed"),
      known: val("known"),
      fault: val("fault"),
      scope: val("scope"),
      consent: !!(consent && consent.checked),
      requestId: form.dataset.requestId || "",
      createdAt: stamp(),
      source: (location.pathname || "/") + " / форма"
    };
  }

  function selectedFiles(form) {
    var input = form.querySelector('input[name="files"]');
    if (!input || !input.files) return [];
    return Array.prototype.slice.call(input.files);
  }

  function fileProblem(files) {
    if (files.length > FILE_COUNT) return "Можно приложить не больше " + FILE_COUNT + " файлов.";
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var ext = String(file.name || "").split(".").pop().toLowerCase();
      if (!FILE_EXT[ext]) return "Файл «" + file.name + "» не подходит. Нужны PDF, DOC, DOCX, XLS, XLSX, JPG, PNG или ZIP.";
      if (file.size > FILE_MAX) return "Файл «" + file.name + "» больше 5 МБ.";
    }
    return "";
  }

  function syncExtra(form) {
    var service = "";
    var select = form.querySelector('[name="service"]');
    if (select) service = select.value;
    form.querySelectorAll("[data-extra]").forEach(function (node) {
      node.hidden = node.getAttribute("data-extra") !== service;
    });
  }

  function validate(form, data) {
    var first = null;
    function bad(name, message) {
      setError(form, name, message);
      if (!first) {
        first = form.querySelector('[name="' + name + '"]');
      }
    }
    ["org", "inn", "contact", "phone", "email", "place", "service", "task", "files", "consent"].forEach(function (name) {
      setError(form, name, "");
    });
    if (!data.org) bad("org", "Укажите организацию.");
    if (data.inn && !/^\d{10}(\d{2})?$/.test(data.inn)) bad("inn", "ИНН — 10 или 12 цифр, либо оставьте поле пустым.");
    if (!data.contact) bad("contact", "Укажите контактное лицо.");
    if (!data.place) bad("place", "Укажите место объекта.");
    if (!data.service) bad("service", "Выберите услугу или пункт «Нужна консультация».");
    var hasPhone = phoneOk(data.phone);
    var hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || "");
    if (data.phone && !hasPhone) bad("phone", "Введите телефон: 10 или 11 цифр.");
    if (data.email && !hasEmail) bad("email", "Проверьте написание почты.");
    if (!hasPhone && !hasEmail) bad("email", "Укажите телефон или email — хотя бы одно.");
    var files = selectedFiles(form);
    var fileError = fileProblem(files);
    if (fileError) bad("files", fileError);
    if (!data.task && !files.length) bad("task", "Опишите задачу или приложите файл ТЗ. Готовое ТЗ заново переписывать не нужно.");
    var trap = form.querySelector('[name="botcheck"]');
    if (trap && String(trap.value || "").trim()) bad("consent", "Заявка не отправлена.");
    if (!data.consent) bad("consent", "Нужно согласие с политикой конфиденциальности.");
    if (first && typeof first.focus === "function") first.focus();
    return !first;
  }

  function bindForm(form) {
    var phone = form.querySelector('[name="phone"]');
    if (phone) {
      phone.addEventListener("input", function () {
        phone.value = formatPhone(phone.value);
      });
    }
    var service = form.querySelector('[name="service"]');
    if (service) {
      if (!service.value && document.body.dataset.service) service.value = document.body.dataset.service;
      service.addEventListener("change", function () { syncExtra(form); });
      syncExtra(form);
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = readForm(form);
      data.requestId = ensureId(form);
      data.files = selectedFiles(form);
      data.fileNames = data.files.map(function (file) { return file.name; });
      if (!validate(form, data)) return;
      var sentAt = 0;
      try { sentAt = Number(sessionStorage.getItem("bvs-sent-at") || 0); } catch (e) {}
      if (sentAt && Date.now() - sentAt < 20000) {
        var early = form.querySelector("[data-form-status]");
        if (early) {
          early.hidden = false;
          early.textContent = "Подождите немного перед новой заявкой. Повтор этой же заявки можно отправить после паузы, номер сохранится.";
        }
        return;
      }
      var text = buildMessage(data);
      var submit = form.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      deliver(text, data).then(function (result) {
        var kind = result && result.kind ? result.kind : result;
        var detail = result && result.detail;
        var status = form.querySelector("[data-form-status]");
        if (status) {
          status.hidden = false;
          status.textContent = channelStatus(kind, data.requestId, detail) + " Текст заявки показан ниже, его можно скопировать.";
        }
        var box = form.querySelector("[data-form-copy]");
        if (box) {
          box.hidden = false;
          if (box.parentElement) box.parentElement.hidden = false;
          box.value = text;
        }
        if (kind === "sent") {
          try { sessionStorage.setItem("bvs-sent-at", String(Date.now())); } catch (e) {}
          delete form.dataset.requestId;
        }
        if (submit) submit.disabled = false;
      });
    });
  }

  document.querySelectorAll("form.js-kp-form").forEach(bindForm);

  window.BVS_SEND = {
    WHATSAPP_NUMBER: WHATSAPP_NUMBER,
    TELEGRAM_HANDLE: TELEGRAM_HANDLE,
    PUBLIC_EMAIL: PUBLIC_EMAIL,
    PHONE_HUMAN: PHONE_HUMAN,
    formatPhone: formatPhone,
    phoneOk: phoneOk,
    buildMessage: buildMessage,
    openChannel: openChannel,
    deliver: deliver,
    channelStatus: channelStatus,
    adapter: BVS_DELIVERY
  };
})();
