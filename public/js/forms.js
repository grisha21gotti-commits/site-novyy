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
      var body = {
        access_key: this.accessKey,
        subject: payload.subject,
        from_name: payload.fromName,
        name: payload.name,
        email: payload.email,
        message: payload.message,
        botcheck: ""
      };
      if (payload.replyto) body.replyto = payload.replyto;
      if (payload.requestId) body.request_id = payload.requestId;
      return fetch(this.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body)
      }).then(function (res) {
        return res.json().catch(function () { return {}; });
      }).then(function (answer) {
        return { ok: !!(answer && answer.success === true), raw: answer };
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

  function buildMessage(data) {
    var lines = [
      "Запрос КП с сайта Бурводстрой",
      "",
      "Организация: " + (data.org || "—"),
      "ИНН: " + (data.inn || "—"),
      "Населённый пункт / объект: " + (data.place || "—"),
      "Тип объекта: " + (data.objectType || "—"),
      "Нужный объём воды, м³/сутки: " + (data.volume || "—"),
      "Назначение воды: " + (data.purpose || "—"),
      "Желаемые сроки: " + (data.timing || "—"),
      "Какие документы уже есть: " + (data.docs || "—"),
      "Контактное лицо: " + (data.contact || "—"),
      "Телефон: " + (data.phone || "—"),
      "Email: " + (data.email || "—"),
      "Задача / ТЗ: " + (data.task || "—"),
      "",
      "Согласие с политикой конфиденциальности: да"
    ];
    return lines.join("\n");
  }

  function channelStatus(kind, requestId) {
    var id = requestId ? " Номер обращения: " + requestId + "." : "";
    if (kind === "sent") {
      return "Заявка отправлена." + id + " Если письма нет во входящих, проверьте папку «Спам».";
    }
    if (kind === "whatsapp") {
      return "Мы открыли WhatsApp со сводкой заявки. Если окно не появилось, позвоните " + PHONE_HUMAN + " или напишите на " + PUBLIC_EMAIL + ".";
    }
    if (kind === "telegram") {
      return "Мы открыли Telegram со сводкой заявки. Если окно не появилось, позвоните " + PHONE_HUMAN + " или напишите на " + PUBLIC_EMAIL + ".";
    }
    return "Письмо через сервис не ушло. Это не отправка. Мы открыли черновик на " + PUBLIC_EMAIL + ". Вложения к черновику нужно добавить вручную. Если окно не появилось, позвоните " + PHONE_HUMAN + ".";
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
      requestId: data && data.requestId
    };
    return BVS_DELIVERY.send(payload).then(function (result) {
      if (result && result.ok) return "sent";
      mailtoDraft(text);
      return "email";
    }).catch(function () {
      mailtoDraft(text);
      return "email";
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
      var el = form.querySelector('[name="' + name + '"]');
      return el ? String(el.value || "").trim() : "";
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
      consent: !!(consent && consent.checked)
    };
  }

  function validate(form, data) {
    var first = null;
    function bad(name, message) {
      setError(form, name, message);
      if (!first) {
        first = form.querySelector('[name="' + name + '"]');
      }
    }
    ["org", "inn", "contact", "phone", "email", "consent"].forEach(function (name) {
      setError(form, name, "");
    });
    if (!data.org) bad("org", "Укажите организацию.");
    if (data.inn && !/^\d{10}(\d{2})?$/.test(data.inn)) bad("inn", "ИНН — 10 или 12 цифр, либо оставьте поле пустым.");
    if (!data.contact) bad("contact", "Укажите контактное лицо.");
    var hasPhone = phoneOk(data.phone);
    var hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || "");
    if (data.phone && !hasPhone) bad("phone", "Введите телефон: 10 или 11 цифр.");
    if (data.email && !hasEmail) bad("email", "Проверьте написание почты.");
    if (!hasPhone && !hasEmail) bad("email", "Укажите телефон или email — хотя бы одно.");
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
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = readForm(form);
      if (!data.requestId) data.requestId = "BVS-" + Date.now().toString(36).toUpperCase();
      form.dataset.requestId = data.requestId;
      if (!validate(form, data)) return;
      var text = buildMessage(data);
      text = "Номер обращения: " + data.requestId + "\n" + text;
      var submit = form.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      deliver(text, data).then(function (kind) {
        var status = form.querySelector("[data-form-status]");
        if (status) {
          status.hidden = false;
          status.textContent = channelStatus(kind, data.requestId) + " Текст заявки показан ниже, его можно скопировать.";
        }
        var box = form.querySelector("[data-form-copy]");
        if (box) {
          box.hidden = false;
          if (box.parentElement) box.parentElement.hidden = false;
          box.value = text;
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
