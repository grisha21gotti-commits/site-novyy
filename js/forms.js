/* Заявка КП. Цены этот файл не считает.
   Если заполнен WhatsApp — открывается WhatsApp, иначе Telegram.
   Иначе письмо уходит через Web3Forms на ящик, к которому выпущен ключ.
   «Отправлено» пишем только когда сервис ответил success: true.
   Если сервис недоступен, открывается черновик письма на EMAIL_TO.
   WEB3FORMS_ACCESS_KEY — публичный ключ формы, не пароль от почты. */
(function () {
  // [ЗАПОЛНИТЬ: номер WhatsApp в формате 7XXXXXXXXXX]
  var WHATSAPP_NUMBER = "";
  // [ЗАПОЛНИТЬ: аккаунт или номер Telegram] — username без @
  var TELEGRAM_HANDLE = "";
  var EMAIL_TO = "ggbolfghjab@yandex.ru";
  var PHONE_HUMAN = "+7 (4752) 45-49-17";
  var WEB3FORMS_ACCESS_KEY = "42427bbc-da4e-43b7-83f2-abf1b957878c";
  var WEB3FORMS_URL = "https://api.web3forms.com/submit";

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

  function channelStatus(kind) {
    if (kind === "sent") {
      return "Заявка отправлена на " + EMAIL_TO + ". Если письма нет во входящих, проверьте папку «Спам».";
    }
    if (kind === "whatsapp") {
      return "Мы открыли WhatsApp со сводкой заявки. Если окно не появилось, позвоните " + PHONE_HUMAN + " или напишите на " + EMAIL_TO + ".";
    }
    if (kind === "telegram") {
      return "Мы открыли Telegram со сводкой заявки. Если окно не появилось, позвоните " + PHONE_HUMAN + " или напишите на " + EMAIL_TO + ".";
    }
    return "Письмо через сервис не ушло. Мы открыли черновик на " + EMAIL_TO + ". Если окно не появилось, позвоните " + PHONE_HUMAN + ".";
  }

  function mailtoDraft(text) {
    var subject = "Запрос КП с сайта Бурводстрой";
    window.location.href = "mailto:" + EMAIL_TO + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
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
    var visitorEmail = data && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || "") ? data.email : "";
    var payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: subject,
      from_name: (data && (data.contact || data.org)) || "Сайт Бурводстрой",
      name: (data && data.contact) || "Заявка с сайта",
      email: visitorEmail || EMAIL_TO,
      message: text,
      botcheck: ""
    };
    if (visitorEmail) payload.replyto = visitorEmail;
    return fetch(WEB3FORMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().catch(function () { return {}; });
    }).then(function (body) {
      if (body && body.success === true) return "sent";
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
    if (!phoneOk(data.phone)) bad("phone", "Введите телефон: 10 или 11 цифр.");
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) bad("email", "Проверьте написание почты или оставьте поле пустым.");
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
      if (!validate(form, data)) return;
      var text = buildMessage(data);
      var submit = form.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      deliver(text, data).then(function (kind) {
        var status = form.querySelector("[data-form-status]");
        if (status) {
          status.hidden = false;
          status.textContent = channelStatus(kind) + " Текст заявки показан ниже, его можно скопировать.";
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
    EMAIL_TO: EMAIL_TO,
    PHONE_HUMAN: PHONE_HUMAN,
    formatPhone: formatPhone,
    phoneOk: phoneOk,
    buildMessage: buildMessage,
    openChannel: openChannel,
    deliver: deliver,
    channelStatus: channelStatus
  };
})();
