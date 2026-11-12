/* Консультант отвечает только записями из /data/knowledge-base.js.
   Цены не называет. Если совпадения нет — честно отправляет к КП или звонку.
   Базовый режим не ходит в интернет и не требует ключа.

   Опциональный апгрейд (не вместо базы): если сайт остаётся опубликованным
   в Grok Build и для этого приложения включены встроенные SpaceXSI / xAI API,
   сюда можно добавить перефраз ТОЛЬКО уже найденного ответа из базы.
   Жёстко: не отвечать тем, чего нет в базе; никогда не называть цены;
   если не уверен — предложить запрос КП или звонок +7 (4752) 45-49-17.
   Если встроенный API недоступен, остаётся этот сценарный режим.
   Поле «вставьте ключ» не добавлять: ключ в JavaScript увидит любой посетитель.
   На обычном хостинге после выгрузки в GitHub встроенный вызов Grok Build
   официально не обещан, поэтому сценарный режим обязателен. */
(function () {
  var FALLBACK = "В базе сайта этого нет. Чтобы не придумать ответ, оставьте запрос коммерческого предложения или позвоните +7 (4752) 45-49-17.";

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^a-zа-я0-9+\-]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function scoreEntry(entry, query) {
    var keys = entry.keys || [];
    var total = 0;
    var hits = 0;
    keys.forEach(function (key) {
      var nk = normalize(key);
      if (!nk) return;
      var matched = false;
      if (nk.length < 4) {
        var escaped = nk.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        matched = new RegExp("(^| )" + escaped + "( |$)").test(query);
      } else if (query.indexOf(nk) !== -1) {
        matched = true;
      }
      if (!matched) return;
      hits += 1;
      total += Math.min(14, Math.max(4, nk.length));
    });
    return { total: total, hits: hits };
  }

  function find(raw) {
    var query = normalize(raw);
    var list = window.BVS_KNOWLEDGE || [];
    if (query.length < 2) {
      return { ok: false, text: "Напишите вопрос чуть конкретнее или выберите подсказку." };
    }
    var best = null;
    var priceHit = null;
    list.forEach(function (entry) {
      var s = scoreEntry(entry, query);
      if (entry.id === "price" && s.hits > 0) priceHit = entry;
      if (!best || s.total > best.total || (s.total === best.total && s.hits > best.hits)) {
        best = { entry: entry, total: s.total, hits: s.hits };
      }
    });
    /* Вопрос о цене не должен проигрывать более длинному слову вроде «бурение». */
    if (priceHit) return { ok: true, id: priceHit.id, text: priceHit.answer };
    if (!best || best.total < 4) return { ok: false, text: FALLBACK };
    return { ok: true, id: best.entry.id, text: best.entry.answer };
  }

  /* Точка для будущего перефраза. Сейчас всегда возвращает ответ базы как есть. */
  function deliver(found) {
    return found.text;
  }

  window.BVS_CONSULTANT = {
    greeting: "Здравствуйте. Я консультант сайта «Бурводстрой». Отвечаю только по материалам сайта: услуги, документы, сроки бурения, география. Цену не называю.",
    suggestions: [
      "Что входит в работы под ключ",
      "Какие документы",
      "Сроки",
      "Как запросить КП",
      "Контакты"
    ],
    reply: function (text) {
      return deliver(find(text));
    }
  };
})();
