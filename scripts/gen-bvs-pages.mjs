/* НЕ ЗАПУСКАТЬ ПОВТОРНО без нужды: скрипт перезаписывает HTML и content.
   Правки для владельца — в самих страницах и в папке content. */
import fs from "node:fs";
import path from "node:path";

const root = "/workspace";
const pages = {};

function esc(s) {
  return String(s)
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">");
}

function jsString(s) {
  return JSON.stringify(s);
}

const PHONE = "+7 (4752) 45-49-17";
const ADDR = "392018, г. Тамбов, ул. Заводская, д. 52";
const ADDR_NOTE =
  "В Яндекс.Картах указан другой адрес — Заводской проезд, 20. Перед визитом позвоните и уточните, куда ехать. [ПОДТВЕРДИТЬ: какой адрес показывать как основной]";
const ZSO = "[ПОДТВЕРДИТЬ: делаете ли проектирование / сопровождение зоны санитарной охраны]";
const SERVICE = "[ПОДТВЕРДИТЬ: какой сервис предлагаете после сдачи объекта]";
const WARRANTY = "[ПОДТВЕРДИТЬ: на старом сайте указан 1 год]";
const HISTORY =
  "[ПОДТВЕРДИТЬ: более 9,5 тыс. водозаборных скважин и более 8 тыс. водонапорных башен — формулировка старого сайта]";
const CASE_FILL = "[ЗАПОЛНИТЬ: объект, заказчик если можно назвать, год, м³/сутки, что сделали]";
const REVIEW_FILL =
  "[ЗАПОЛНИТЬ: отзыв после объекта — название организации только с согласия, населённый пункт, тип работ]";
const PHOTO = "[ЗАПОЛНИТЬ: фото объектов]";
const SCANS = "[ЗАПОЛНИТЬ: сканы документов]";
const WA = "[ЗАПОЛНИТЬ: номер WhatsApp в формате 7XXXXXXXXXX]";
const TG = "[ЗАПОЛНИТЬ: аккаунт или номер Telegram]";
const DOMAIN = "[ЗАПОЛНИТЬ: боевой домен, например https://bvs68.ru]";
const MOBILE = "[ЗАПОЛНИТЬ: мобильный телефон, если есть]";
const PHONES_OK = "[ПОДТВЕРДИТЬ: какие телефоны показывать как основные]";
const FAV = "[ПОДТВЕРДИТЬ: использовать ли архивный favicon со старого сайта или оставить знак «БВ»]";

function field(bag, key, text) {
  bag[key] = text;
  return text;
}

function T(bag, file, key, text, tag, cls) {
  bag[key] = text;
  const classAttr = cls ? ` class="${cls}"` : "";
  return `<!-- РЕДАКТИРОВАТЬ: поле ${key} из content/${file} -->\n<${tag}${classAttr} data-field="${key}">${esc(text)}</${tag}>`;
}

function icon(pathD) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22"><path fill="currentColor" d="${pathD}"/></svg>`;
}

const I = {
  drop: icon("M12 2c4 4.5 6 7.2 6 10a6 6 0 1 1-12 0c0-2.8 2-5.5 6-10z"),
  doc: icon("M6 2h8l4 4v16H6V2zm8 1.5V7h3.5L14 3.5zM8 11h8v1.5H8V11zm0 3h8v1.5H8V14z"),
  shield: icon("M12 2l8 3v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V5l8-3z"),
  gear: icon("M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.5 3.2l-1.8-.4a6.7 6.7 0 0 0-.8-1.8l1-1.5-1.4-1.4-1.5 1a6.7 6.7 0 0 0-1.8-.8L13.8 4h-2l-.4 1.8a6.7 6.7 0 0 0-1.8.8l-1.5-1-1.4 1.4 1 1.5a6.7 6.7 0 0 0-.8 1.8L4 11.2v2l1.8.4c.2.6.5 1.2.8 1.8l-1 1.5 1.4 1.4 1.5-1c.6.3 1.2.6 1.8.8l.4 1.8h2l.4-1.8c.6-.2 1.2-.5 1.8-.8l1.5 1 1.4-1.4-1-1.5c.3-.6.6-1.2.8-1.8l1.8-.4v-2z"),
  pin: icon("M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"),
  clock: icon("M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v5.2l3.2 1.9-.8 1.3L11 13V7h2z"),
};

function cases(prefixNote) {
  const cards = [1, 2, 3, 4]
    .map(
      (n) => `<article class="placeholder-card">
        <h3>Объект ${n}</h3>
        <dl>
          <dt>Объект</dt><dd>[ЗАПОЛНИТЬ: объект]</dd>
          <dt>Заказчик, если можно назвать</dt><dd>[ЗАПОЛНИТЬ: заказчик, если можно назвать]</dd>
          <dt>Год</dt><dd>[ЗАПОЛНИТЬ: год]</dd>
          <dt>Дебит, м³/сутки</dt><dd>[ЗАПОЛНИТЬ: дебит, м³/сутки]</dd>
          <dt>Состав работ</dt><dd>[ЗАПОЛНИТЬ: состав работ]</dd>
        </dl>
        <p>Фото: ${PHOTO}</p>
      </article>`,
    )
    .join("");
  return `<div class="cards cards-2">${cards}</div>
    <p>${CASE_FILL}. ${prefixNote}</p>`;
}

function formBlock(prefill, asset) {
  const place = prefill ? esc(prefill) : "";
  return `<form class="kp-form js-kp-form" action="mailto:ggbolfghjab@yandex.ru" method="post" enctype="text/plain" novalidate>
    <div class="form-grid two">
      <label>Организация *
        <input name="org" required autocomplete="organization" maxlength="200">
        <span class="field-error" data-error-for="org"></span>
      </label>
      <label>ИНН
        <input name="inn" inputmode="numeric" maxlength="12" autocomplete="off">
        <span class="field-error" data-error-for="inn"></span>
      </label>
      <label>Контактное лицо *
        <input name="contact" required autocomplete="name" maxlength="120">
        <span class="field-error" data-error-for="contact"></span>
      </label>
      <label>Телефон *
        <input name="phone" required autocomplete="tel" placeholder="+7 (___) ___-__-__" inputmode="tel">
        <span class="field-error" data-error-for="phone"></span>
      </label>
      <label>Email
        <input name="email" type="email" autocomplete="email" maxlength="120">
        <span class="field-error" data-error-for="email"></span>
      </label>
      <label>Населённый пункт / объект
        <input name="place" value="${place}" maxlength="160">
      </label>
      <label>Тип объекта
        <select name="objectType">
          <option value="">Выберите</option>
          <option>ферма</option>
          <option>агрохолдинг</option>
          <option>промышленность</option>
          <option>муниципалитет</option>
          <option>другое</option>
        </select>
      </label>
      <label>Нужный объём воды, м³/сутки
        <input name="volume" maxlength="80">
      </label>
      <label>Назначение
        <select name="purpose">
          <option value="">Пока не знаем</option>
          <option>питьевое</option>
          <option>технологическое</option>
          <option>смешанное</option>
          <option>пока не знаем</option>
        </select>
      </label>
      <label>Желаемые сроки
        <input name="timing" maxlength="160">
      </label>
    </div>
    <div class="form-grid">
      <label>Какие документы уже есть
        <input name="docs" maxlength="240" placeholder="ничего / проект / лицензия / паспорт / другое">
      </label>
      <label>Кратко задача, можно вставить ТЗ
        <textarea name="task" maxlength="4000"></textarea>
      </label>
      <label class="check-row">
        <input type="checkbox" name="consent" required>
        <span>Согласен на обработку данных по <a href="${asset}privacy.html">политике конфиденциальности</a>.</span>
      </label>
      <span class="field-error" data-error-for="consent"></span>
      <div class="actions">
        <button class="btn btn-primary" type="submit">Запросить коммерческое предложение</button>
        <button class="btn btn-ghost js-open-kp" type="button">Заполнить заявку с помощью бота</button>
      </div>
      <p class="fine">Заявка уходит письмом на ggbolfghjab@yandex.ru через сервис Web3Forms. На сервере сайта она не хранится. WhatsApp: ${WA}. Telegram: ${TG}. Калькулятора и цены за метр нет.</p>
      <div class="form-status" data-form-status hidden></div>
      <label data-form-copy-wrap hidden>Текст заявки
        <textarea data-form-copy readonly></textarea>
      </label>
    </div>
  </form>`;
}

function header(asset, current) {
  const cur = (id) => (current === id ? ' aria-current="page"' : "");
  const districts = ["michurinsk", "rasskazovo", "morshansk", "kotovsk"];
  const dropCurrent = districts.includes(current) ? ' aria-current="page"' : "";
  return `<a class="skip" href="#main">К содержанию</a>
<header class="site-header">
  <div class="container header-bar">
    <a class="brand" href="${asset}index.html">
      <img src="${asset}img/logo.png" width="417" height="244" alt="БУРВОДСТРОЙ. Комплексные решения профессионалов" ${current === "home" ? 'fetchpriority="high"' : ""}>
      <span class="brand-sub" data-company="brandLine">Тамбов • водозабор под ключ</span>
    </a>
    <button class="burger" type="button" data-burger aria-expanded="false" aria-controls="site-nav">
      <span></span><span></span><span></span>
      <span class="visually-hidden" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Меню</span>
    </button>
    <nav id="site-nav" class="nav" data-nav aria-label="Разделы сайта">
      <a href="${asset}uslugi.html"${cur("uslugi")}>Услуги</a>
      <a href="${asset}otrasli.html"${cur("otrasli")}>Отрасли</a>
      <a href="${asset}dokumenty.html"${cur("dokumenty")}>Документы</a>
      <div class="nav-drop" data-drop>
        <button type="button" class="nav-drop-btn" data-drop-btn aria-expanded="false"${dropCurrent}>Районы</button>
        <div class="nav-drop-panel">
          <a href="${asset}rayony/michurinsk.html"${cur("michurinsk")}>Мичуринск</a>
          <a href="${asset}rayony/rasskazovo.html"${cur("rasskazovo")}>Рассказово</a>
          <a href="${asset}rayony/morshansk.html"${cur("morshansk")}>Моршанск</a>
          <a href="${asset}rayony/kotovsk.html"${cur("kotovsk")}>Котовск</a>
        </div>
      </div>
      <a href="${asset}kontakty.html"${cur("kontakty")}>Контакты</a>
    </nav>
    <div class="header-contacts">
      <a class="header-phone" data-company="phoneMain" data-company-href="phoneMainHref" href="tel:+74752454917">${PHONE}</a>
      <a class="btn btn-primary" href="${current === "privacy" ? asset + "index.html#kp" : "#kp"}">Запросить КП</a>
    </div>
  </div>
  <div class="addr-bar">
    <div class="container">
      <strong data-company="address">${ADDR}</strong>
      <span class="addr-note" data-company="addressNote"> ${ADDR_NOTE}</span>
    </div>
  </div>
</header>`;
}

function footer(asset) {
  return `<footer class="site-footer">
  <div class="container footer-grid">
    <div>
      <a class="footer-logo" href="${asset}index.html"><img src="${asset}img/logo.png" width="417" height="244" alt="БУРВОДСТРОЙ" loading="lazy"></a>
      <p class="footer-title">ООО «БУРВОДСТРОЙ»</p>
      <p>ИНН 6829140201<br>ОГРН 1186820001543</p>
      <p data-company="address">${ADDR}</p>
      <p class="fine" data-company="addressNote">${ADDR_NOTE}</p>
    </div>
    <div>
      <p class="footer-title">Разделы</p>
      <ul class="footer-links">
        <li><a href="${asset}uslugi.html">Услуги</a></li>
        <li><a href="${asset}otrasli.html">Отрасли</a></li>
        <li><a href="${asset}dokumenty.html">Документы</a></li>
        <li><a href="${asset}kontakty.html">Контакты</a></li>
        <li><a href="${asset}privacy.html">Политика конфиденциальности</a></li>
      </ul>
    </div>
    <div>
      <p class="footer-title">Связь</p>
      <p><a class="footer-phone" data-company="phoneMain" data-company-href="phoneMainHref" href="tel:+74752454917">${PHONE}</a><br>основной</p>
      <p><a data-company="phoneAlt" data-company-href="phoneAltHref" href="tel:+74752455995">+7 (4752) 45-59-95</a><br>дополнительный</p>
      <p><a data-company="email" data-company-href="emailHref" href="mailto:bvs_tam@mail.ru">bvs_tam@mail.ru</a></p>
      <p>Режим: <span data-company="hours">пн–пт 08:00–17:00, сб–вс выходной</span></p>
      <p class="fine">${PHONES_OK} Мобильный: ${MOBILE}</p>
    </div>
  </div>
  <div class="container"><p class="fine">Гидрогеология • проект • лицензия • ВЗУ • ЗСО • паспорт скважины</p></div>
  <div class="footer-copy"><div class="container"><p>© 2026 ООО «БУРВОДСТРОЙ». ${FAV}</p></div></div>
</footer>`;
}

function layout(opts) {
  const asset = opts.asset || "";
  const fields = opts.fields || {};
  const file = opts.contentFile;
  const scripts = [
    `${asset}content/company.js`,
    `${asset}content/${file}`,
    `${asset}data/knowledge-base.js`,
    `${asset}js/render-content.js`,
    `${asset}js/forms.js`,
    `${asset}js/bot-consultant.js`,
    `${asset}js/bot-kp.js`,
    `${asset}js/bots-ui.js`,
    `${asset}js/main.js`,
  ]
    .map((src) => `<script src="${src}"></script>`)
    .join("\n");
  const json = opts.jsonLd
    ? `<script type="application/ld+json">${opts.jsonLd}</script>`
    : "";
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<script>
(function () {
  var p = location.pathname;
  var dir = p.charAt(p.length - 1) === "/" ? p : p.replace(/[^/]*$/, "");
  if (!dir) dir = "/";
  var b = document.createElement("base");
  b.href = dir;
  document.head.appendChild(b);
})();
</script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}">
<link rel="canonical" href="${esc(opts.canonical)}">
<!-- BASE_URL: ${DOMAIN} -->
<meta property="og:title" content="${esc(opts.title)}">
<meta property="og:description" content="${esc(opts.description)}">
<meta property="og:site_name" content="ООО «БУРВОДСТРОЙ»">
<meta property="og:url" content="${esc(opts.canonical)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ru_RU">
<meta property="og:image" content="${asset}img/og-cover.jpg">
<meta name="theme-color" content="#0060AE">
<link rel="icon" href="${asset}img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${asset}img/apple-touch.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&family=Roboto+Slab:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${asset}css/styles.css">
${json}
</head>
<body data-page="${opts.page}" data-depth="${asset}"${opts.place ? ` data-place="${esc(opts.place)}"` : ""}>
${header(asset, opts.page)}
<main id="main">
${opts.body}
</main>
${footer(asset)}
${scripts}
</body>
</html>
`;
}

function writeContent(file, intro, fields) {
  const lines = Object.keys(fields)
    .map((key) => `  ${jsString(key)}: ${jsString(fields[key])}`)
    .join(",\n");
  const js = `/* ${intro}
   Меняйте только текст в кавычках справа. Не удаляйте имена полей и запятые.
   Если меняете формулировку, обновите и видимый текст в HTML: он нужен до запуска скрипта. */
window.PAGE_CONTENT = {
${lines}
};
`;
  fs.writeFileSync(path.join(root, "content", file), js);
}

function writePage(rel, html) {
  const dest = path.join(root, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
}

const jsonLd = JSON.stringify(
  {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "ООО «БУРВОДСТРОЙ»",
    telephone: "+7-4752-45-49-17",
    email: "bvs_tam@mail.ru",
    address: {
      "@type": "PostalAddress",
      postalCode: "392018",
      addressLocality: "Тамбов",
      streetAddress: "ул. Заводская, д. 52",
      addressCountry: "RU",
    },
    openingHours: "Mo-Fr 08:00-17:00",
    taxID: "6829140201",
    identifier: "ИНН 6829140201",
  },
  null,
  2,
);

function buildHome() {
  const bag = {};
  const file = "index.js";
  const body = `
<section class="hero">
  <div class="container hero-grid">
    <div>
      <p class="kicker">ООО «БУРВОДСТРОЙ» · Тамбов</p>
      ${T(bag, file, "heroTitle", "Водозабор под ключ для хозяйств и предприятий Тамбовской области", "h1", "")}
      ${T(bag, file, "heroLead", "Для ферм, агрохолдингов, промышленных предприятий и муниципалитетов. Делаем легальный источник воды: изыскания, проект, лицензирование недропользования, бурение, обустройство водозаборного узла, сопровождение ЗСО и паспорт скважины.", "p", "lead")}
      <ul class="badges">
        <li data-field="badge1">${esc(field(bag, "badge1", "Под ключ: от гидрогеологии до сдачи ВЗУ"))}</li>
        <li data-field="badge2">${esc(field(bag, "badge2", "Лицензия на недра № ТМБ 80356 ВЭ до 25.06.2028"))}</li>
        <li data-field="badge3">${esc(field(bag, "badge3", "Член СРО, договор подряда, в том числе для конкурентных процедур"))}</li>
      </ul>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#kp">Запросить коммерческое предложение</a>
        <a class="btn btn-ghost" href="uslugi.html">Посмотреть состав работ</a>
        <a class="hero-phone" href="tel:+74752454917">${PHONE}</a>
      </div>
    </div>
    <figure class="scheme">
      <h2>Состав, не фото объекта</h2>
      <ol>
        <li><span class="n">1</span><span>Гидрогеология</span></li>
        <li><span class="n">2</span><span>Проект</span></li>
        <li><span class="n">3</span><span>Лицензия на недра</span></li>
        <li><span class="n">4</span><span>Бурение</span></li>
        <li><span class="n">5</span><span>Водозаборный узел</span></li>
        <li><span class="n">6</span><span>ЗСО — состав подтверждаем</span></li>
        <li><span class="n">7</span><span>Паспорт скважины</span></li>
        <li><span class="n">8</span><span>Сервис по согласованным условиям</span></li>
      </ol>
      <figcaption>Схема состава работ. Это не фотография нашего объекта. ${PHOTO}</figcaption>
    </figure>
  </div>
</section>
<div class="trust"><div class="container"><p>СРО «Союз тамбовских строителей» (реестр № 60) • Лицензия на недра № ТМБ 80356 ВЭ • ООО, официальный договор.</p></div></div>
<section class="section">
  <div class="container">
    <div class="section-head">
      ${T(bag, file, "whoTitle", "Кому работаем", "h2", "")}
      ${T(bag, file, "whoLead", "Заказчик здесь — организация, которой нужен расход в м³/сутки и документы на эксплуатацию, а не отдельная скважина «на дом».", "p", "")}
    </div>
    <div class="cards cards-4">
      <article class="card"><span class="num">01</span>${T(bag, file, "a1t", "Фермы и животноводческие комплексы", "h3", "")}${T(bag, file, "a1p", "Поение, мойка, хозяйственные нужды: нужен устойчивый объём и понятный договор. Считаем задачу от м³/сутки и легальности источника, без цены за метр.", "p", "")}<p><a href="otrasli.html">Отрасли</a></p></article>
      <article class="card"><span class="num">02</span>${T(bag, file, "a2t", "Агрохолдинги и переработка", "h3", "")}${T(bag, file, "a2p", "Несколько площадок, сезонность, вода на технологию и людей. Собираем исходные данные и готовим КП по объекту, а не по «пакету для участка».", "p", "")}<p><a href="otrasli.html">Отрасли</a></p></article>
      <article class="card"><span class="num">03</span>${T(bag, file, "a3t", "Промышленные предприятия", "h3", "")}${T(bag, file, "a3p", "Вода на технологию или питьевое снабжение площадки. Важны непрерывность, узел учёта и документы, по которым объект можно эксплуатировать.", "p", "")}<p><a href="otrasli.html">Отрасли</a></p></article>
      <article class="card"><span class="num">04</span>${T(bag, file, "a4t", "Муниципалитеты и объекты водоснабжения", "h3", "")}${T(bag, file, "a4p", "Поселения и локальные узлы. Работаем по договору подряда, состоим в СРО и можем участвовать в конкурентных процедурах в пределах ответственности по реестру.", "p", "")}<p><a href="otrasli.html">Отрасли</a></p></article>
    </div>
  </div>
</section>
<section class="section section-muted">
  <div class="container">
    <div class="section-head">
      ${T(bag, file, "scopeTitle", "Что входит в водозабор под ключ", "h2", "")}
      ${T(bag, file, "scopeLead", "Семь рабочих контуров и два, которые прямо со старого сайта не выделены отдельной услугой — их помечаем и не додумываем.", "p", "")}
    </div>
    <div class="cards cards-4">
      <article class="card"><div class="icon-line">${I.doc}</div><h3>Гидрогеология и изыскания</h3><p>Понять, откуда брать воду и на каких условиях площадки. <a href="uslugi.html">Состав работ</a></p></article>
      <article class="card"><div class="icon-line">${I.doc}</div><h3>Проект</h3><p>Решения, от которых зависят узел, смета и дальнейшие согласования. <a href="uslugi.html">Состав работ</a></p></article>
      <article class="card"><div class="icon-line">${I.shield}</div><h3>Лицензирование недропользования</h3><p>Чтобы добыча была законной. Срок получения лицензии не обещаем. <a href="dokumenty.html">Документы</a></p></article>
      <article class="card"><div class="icon-line">${I.gear}</div><h3>Бурение</h3><p>Песок и известняк. 1–3 дня — только про бурение, не про весь цикл. <a href="uslugi.html">Состав работ</a></p></article>
      <article class="card"><div class="icon-line">${I.drop}</div><h3>Обустройство водозаборного узла</h3><p>ВЗУ, при необходимости башня Рожновского и пусконаладка. <a href="uslugi.html">Состав работ</a></p></article>
      <article class="card"><div class="icon-line">${I.shield}</div><h3>Зона санитарной охраны</h3><p>${ZSO} <a href="dokumenty.html">Документы</a></p></article>
      <article class="card"><div class="icon-line">${I.doc}</div><h3>Паспорт скважины</h3><p>Конструкция, глубина, результаты обследований — без выдуманных номеров. <a href="dokumenty.html">Документы</a></p></article>
      <article class="card"><div class="icon-line">${I.clock}</div><h3>Сервис после сдачи</h3><p>${SERVICE} <a href="uslugi.html">Состав работ</a></p></article>
    </div>
  </div>
</section>
<section class="section">
  <div class="container">
    ${T(bag, file, "stepsTitle", "Как идём по объекту", "h2", "")}
    ${T(bag, file, "stepsLead", "Весь цикл под ключ не равен 1–3 дням. Эти дни относятся только к бурению, если грунт, погода и тип скважины это позволяют.", "p", "")}
    <div class="steps">
      <article class="step"><span class="n">1</span><div><h3>Заявка и ТЗ</h3><p>Организация, место объекта, нужный расход в м³/сутки, что уже есть на руках.</p></div></article>
      <article class="step"><span class="n">2</span><div><h3>Площадка и подъезд</h3><ul class="check"><li>подъездные пути к участку;</li><li>свободная высота не менее 10 м под буровую мачту;</li><li>ровная площадка минимум 4×10 м;</li><li>электросеть 220 В мощностью 3 кВт.</li></ul></div></article>
      <article class="step"><span class="n">3</span><div><h3>Изыскания и проектные решения</h3><p>Гидрогеология и проект под задачу заказчика, без шаблонной «глубины района».</p></div></article>
      <article class="step"><span class="n">4</span><div><h3>Договор и лицензионный контур</h3><p>Договор, смета, при необходимости сопровождение лицензирования и ЗСО. Срок выдачи лицензии не называем.</p></div></article>
      <article class="step"><span class="n">5</span><div><h3>Бурение и ВЗУ</h3><p>Бурение, обустройство узла, пусконаладка. Башни Рожновского — если они нужны объекту.</p></div></article>
      <article class="step"><span class="n">6</span><div><h3>Сдача</h3><p>Паспорт скважины, документы, пояснения по эксплуатации, сервис по согласованным условиям.</p></div></article>
    </div>
  </div>
</section>
<section class="section section-muted">
  <div class="container">
    ${T(bag, file, "whyTitle", "Почему нам можно доверить водозабор", "h2", "")}
    <div class="cards cards-2">
      <article class="card icon-row"><span class="icon-sq">${I.doc}</span><div><h3>Официальный договор подряда</h3><p>Работаем как ООО, с реквизитами и сметой в предложении, не «по звонку без бумаг».</p></div></article>
      <article class="card icon-row"><span class="icon-sq">${I.shield}</span><div><h3>СРО и лицензия на недра</h3><p>Реестр № 60 и лицензия № ТМБ 80356 ВЭ до 25.06.2028. Конкурентные процедуры — в пределах уровня ответственности СРО.</p></div></article>
      <article class="card icon-row"><span class="icon-sq">${I.doc}</span><div><h3>Паспорт скважины</h3><p>По итогам работ. Даём документальную гарантию. Срок: ${WARRANTY}</p></div></article>
      <article class="card icon-row"><span class="icon-sq">${I.clock}</span><div><h3>Опыт области</h3><p>Работаем в Тамбовской области более 65 лет. ООО «БУРВОДСТРОЙ» — правопреемник АО «БУРВОДСТРОЙ».</p></div></article>
    </div>
    <p>Работаем с хозяйствами и предприятиями, которым нужен большой и законный водоразбор.</p>
    <p class="fine">${HISTORY}</p>
  </div>
</section>
<section class="section">
  <div class="container">
    ${T(bag, file, "geoTitle", "География", "h2", "")}
    ${T(bag, file, "geoLead", "Работаем по Тамбову и Тамбовской области.", "p", "")}
    <div class="chips">
      <a class="chip" href="rayony/michurinsk.html">Мичуринск</a>
      <a class="chip" href="rayony/rasskazovo.html">Рассказово</a>
      <a class="chip" href="rayony/morshansk.html">Моршанск</a>
      <a class="chip" href="rayony/kotovsk.html">Котовск</a>
    </div>
    ${T(bag, file, "geoNote", "Если вашего района нет в списке — всё равно отправьте заявку, выезжаем по области к хозяйствам и предприятиям.", "p", "")}
  </div>
</section>
<section class="section section-muted">
  <div class="container">
    ${T(bag, file, "casesTitle", "Свежие объекты", "h2", "")}
    ${T(bag, file, "casesLead", "Сюда встанут свежие объекты. Старые контракты 2012–2014 годов специально не публикуем.", "p", "")}
    ${cases("")}
  </div>
</section>
<section class="section">
  <div class="container">
    ${T(bag, file, "revTitle", "Отзывы", "h2", "")}
    <div class="review-box">
      ${T(bag, file, "revLead", "Отзывы оставляют на картах. Мы не публикуем вымышленные цитаты.", "p", "")}
      <div class="actions">
        <a class="btn btn-ghost" href="https://2gis.ru/tambov/firm/11400264837762658">Смотреть в 2ГИС</a>
        <a class="btn btn-ghost" href="https://yandex.ru/maps/?text=%D0%91%D1%83%D1%80%D0%B2%D0%BE%D0%B4%D1%81%D1%82%D1%80%D0%BE%D0%B9%2C%20%D0%A2%D0%B0%D0%BC%D0%B1%D0%BE%D0%B2">Смотреть в Яндекс.Картах</a>
      </div>
      <p>${REVIEW_FILL}</p>
    </div>
  </div>
</section>
<section class="section section-muted" id="kp">
  <div class="container split">
    <div>
      ${T(bag, file, "kpTitle", "Запрос коммерческого предложения", "h2", "")}
      ${T(bag, file, "kpLead", "Напишите задачу организации. В ответ подготовим КП. Цену на сайте не показываем и в письме заранее не придумываем.", "p", "")}
      <div class="form-card">${formBlock("", "")}</div>
    </div>
    <aside class="req-card">
      <h3>Как связаться</h3>
      <p><a href="tel:+74752454917">${PHONE}</a><br>дополнительный <a href="tel:+74752455995">+7 (4752) 45-59-95</a></p>
      <p><a href="mailto:bvs_tam@mail.ru">bvs_tam@mail.ru</a></p>
      <p>пн–пт 08:00–17:00, сб–вс выходной. Если пишете в выходной, ответим в ближайший рабочий день.</p>
    </aside>
  </div>
</section>
<section class="section">
  <div class="container">
    ${T(bag, file, "reqTitle", "Реквизиты", "h2", "")}
    <div class="req-card">
      <dl>
        <dt>Полное имя</dt><dd>Общество с ограниченной ответственностью «БУРВОДСТРОЙ»</dd>
        <dt>ИНН / КПП</dt><dd>6829140201 / 682901001</dd>
        <dt>ОГРН</dt><dd>1186820001543 от 20.02.2018</dd>
        <dt>ОКПО</dt><dd>25309655</dd>
        <dt>Директор</dt><dd>Батищев Михаил Вячеславович</dd>
        <dt>Юридический адрес</dt><dd>${ADDR}. ${ADDR_NOTE}</dd>
        <dt>Лицензия</dt><dd>Лицензия на пользование недрами № ТМБ 80356 ВЭ (геологическое изучение и добыча подземных вод), срок до 25.06.2028. Орган: Управление по охране окружающей среды и природопользованию Тамбовской области.</dd>
        <dt>СРО</dt><dd>Союз тамбовских строителей, реестр № 60. <a href="https://stroytambov.ru/reestr/view?id=10">Запись в реестре</a>. Состоим в СРО, можем работать по договорам подряда, в том числе в конкурентных процедурах.</dd>
      </dl>
    </div>
  </div>
</section>`;
  writeContent(file, "Это тексты ГЛАВНОЙ страницы.", bag);
  writePage(
    "index.html",
    layout({
      title: "Водозабор под ключ для хозяйств и предприятий — Бурводстрой, Тамбов",
      description:
        "ООО «БУРВОДСТРОЙ» проектирует и строит легальные водозаборы для ферм, агрохолдингов, промышленности и муниципалитетов в Тамбове и области. Договор, лицензия на недра, ВЗУ, ЗСО, паспорт скважины. +7 (4752) 45-49-17.",
      canonical: "./",
      page: "home",
      contentFile: file,
      fields: bag,
      body,
      jsonLd,
    }),
  );
}

function buildUslugi() {
  const bag = {};
  const file = "uslugi.js";
  const body = `<section class="page-hero"><div class="container prose">
    ${T(bag, file, "h1", "Состав работ по водозабору под ключ", "h1", "")}
    ${T(bag, file, "lead", "Ниже не прайс и не пакеты «стандарт / премиум». Это перечень того, из чего складывается легальный водозабор для организации. Стоимость назовём в коммерческом предложении.", "p", "lead")}
  </div></section>
  <section class="section"><div class="container cards">
    <article class="card"><h2>Гидрогеологические и инженерные изыскания</h2><p>Смотрим площадку и условия, от которых зависит, можно ли взять нужный расход. Не публикуем «среднюю глубину по району»: её нет в подтверждённых материалах компании.</p></article>
    <article class="card"><h2>Проектирование</h2><p>Проектные решения под задачу: питьевая вода, технология или смешанное назначение, узел, при необходимости сети и башня. Смету готовим в КП, на сайте её нет.</p></article>
    <article class="card"><h2>Лицензирование недропользования</h2><p>Заказчику лицензионный контур нужен, чтобы добывать подземные воды законно, а не только пробурить ствол. У компании есть лицензия № ТМБ 80356 ВЭ до 25.06.2028 на геологическое изучение и добычу подземных вод. Срок, за который орган выдаст лицензию заказчику, мы не называем: такой цифры нет.</p></article>
    <article class="card"><h2>Бурение</h2><p>Водозаборные скважины в Тамбове и области, в том числе для промышленных и сельскохозяйственных предприятий. Оценка срока службы со старого сайта: песчаная скважина — около 15 лет, скважина на известняк — около 30 лет. Это не гарантия. Комплекс бурения — 1–3 дня с учётом сложности грунта, погоды и типа скважины. Весь водозабор под ключ за эти дни не обещаем.</p></article>
    <article class="card"><h2>Обустройство водозаборного узла</h2><p>ВЗУ, сети при необходимости, установка водонапорных башен системы инженера Рожновского и пусконаладочные работы. Состав зависит от объекта.</p></article>
    <article class="card"><h2>Зона санитарной охраны</h2><p>ЗСО задаёт санитарный режим вокруг источника. На старом сайте отдельный пункт «проектирование ЗСО» не выделен, поэтому состав не расписываем. ${ZSO}</p></article>
    <article class="card"><h2>Паспорт скважины</h2><p>После работ оформляем паспорт: обычно в нём конструкция, глубина и результаты обследований. Номера чужих паспортов не придумываем.</p></article>
    <article class="card"><h2>Сервис</h2><p>Рассказываем, как пользоваться скважиной. Дальше — по согласованным условиям. ${SERVICE}</p></article>
    <article class="card"><h2>Площадка, которую готовит заказчик</h2><ul class="check"><li>подъездные пути к участку;</li><li>свободная высота не менее 10 м под буровую мачту;</li><li>ровная площадка минимум 4×10 м;</li><li>возможность подключения к электросети 220 В мощностью 3 кВт.</li></ul></article>
  </div></section>
  <section class="section section-muted" id="kp"><div class="container">
    <h2>Запросить КП</h2>
    <div class="form-card">${formBlock("", "")}</div>
  </div></section>`;
  writeContent(file, "Это тексты страницы УСЛУГ.", bag);
  writePage(
    "uslugi.html",
    layout({
      title: "Водозабор под ключ: состав работ — Бурводстрой",
      description:
        "Состав работ ООО «БУРВОДСТРОЙ»: изыскания, проект, лицензия на недра, бурение, ВЗУ, ЗСО, паспорт скважины. Без цены за метр. Тамбов, +7 (4752) 45-49-17.",
      canonical: "uslugi.html",
      page: "uslugi",
      contentFile: file,
      body,
    }),
  );
}

function buildDocs() {
  const bag = {};
  const file = "dokumenty.js";
  const body = `<section class="page-hero"><div class="container prose">
    ${T(bag, file, "h1", "Документы легального водозабора", "h1", "")}
    ${T(bag, file, "lead", "Заказчику нужны не лозунги, а бумаги, по которым источник можно эксплуатировать. Здесь только то, что компания может подтвердить, и пометки там, где подтверждения ещё нет.", "p", "lead")}
  </div></section>
  <section class="section"><div class="container cards">
    <article class="card"><h2>Договор подряда и смета</h2><p>Работы идут по договору. Смету готовим в коммерческом предложении под конкретный объект. На сайте нет ставки за метр и нет «пакетов» с выдуманной ценой.</p></article>
    <article class="card"><h2>Лицензия на недра</h2><p>№ ТМБ 80356 ВЭ от 25.06.2018, действует по 25.06.2028. Выдана Управлением по охране окружающей среды и природопользованию Тамбовской области. Вид пользования: геологическое изучение и добыча подземных вод для питьевого водоснабжения населения или технологического обеспечения водой объектов промышленности.</p><p>Заказчику это важно простыми словами: добыча подземных вод должна быть разрешена, иначе скважина есть, а законной эксплуатации нет. Это не заключение юриста по вашей площадке и не обещание срока лицензии.</p></article>
    <article class="card"><h2>Членство в СРО</h2><p>Реестровый номер 60, СРО «Союз тамбовских строителей». <a href="https://stroytambov.ru/reestr/view?id=10">Открыть запись в реестре</a>. Право на работы по договорам строительного подряда действует, есть право заключать договоры конкурентными способами. Состоим в СРО, можем работать по договорам подряда, в том числе в конкурентных процедурах. По реестру обязательства по одному договору и по конкурентным процедурам не превышают 90 млн ₽.</p></article>
    <article class="card"><h2>Паспорт скважины</h2><p>В паспорте обычно фиксируют конструкцию, глубину и результаты обследований. Готового «образца с номером» на сайте нет — не рисуем чужой документ.</p></article>
    <article class="card"><h2>Зона санитарной охраны</h2><p>ЗСО нужна, чтобы вокруг водозабора был санитарный режим: кто и как пользуется территорией у скважин. Регламент и пояса под конкретный объект здесь не выдумываем. ${ZSO}</p></article>
    <article class="card"><h2>Документальная гарантия</h2><p>Даём документальную гарантию. Срок: ${WARRANTY}</p></article>
    <article class="card"><h2>Сканы</h2><p>Сюда можно положить свидетельства и лицензию, когда будут файлы. ${SCANS} Печати и сертификаты мы не рисуем.</p></article>
  </div></section>
  <section class="section section-muted" id="kp"><div class="container"><h2>Запросить КП</h2><div class="form-card">${formBlock("", "")}</div></div></section>`;
  writeContent(file, "Это тексты страницы ДОКУМЕНТЫ.", bag);
  writePage(
    "dokumenty.html",
    layout({
      title: "Лицензия, СРО, ЗСО и паспорт скважины — Бурводстрой",
      description:
        "Документы ООО «БУРВОДСТРОЙ»: договор, лицензия на недра № ТМБ 80356 ВЭ до 25.06.2028, СРО № 60, паспорт скважины, ЗСО. Тамбов.",
      canonical: "dokumenty.html",
      page: "dokumenty",
      contentFile: file,
      body,
    }),
  );
}

function buildOtrasli() {
  const bag = {};
  const file = "otrasli.js";
  const body = `<section class="page-hero"><div class="container prose">
    ${T(bag, file, "h1", "Решения для разных заказчиков", "h1", "")}
    ${T(bag, file, "lead", "Один и тот же ствол не закрывает задачу хозяйства, завода и поселения. Ниже — типовые задачи организаций. Дебиты чужих объектов не подставляем.", "p", "lead")}
  </div></section>
  <section class="section"><div class="container cards">
    <article class="card"><h2>Сельхоз и животноводство</h2><p>Ферме нужен расход в м³/сутки на поение, мойку и хозяйство, плюс документы, чтобы источник эксплуатировать. В работы входят изыскания, проект, при необходимости лицензирование, бурение, ВЗУ и паспорт. Непрерывность важнее «быстрой дырки».</p><p><a class="btn btn-primary" href="#kp">Запросить КП</a></p></article>
    <article class="card"><h2>Агрохолдинги и переработка</h2><p>Несколько площадок, сезон, вода и на людей, и на технологию. В заявке лучше сразу указать объём, назначение и какие документы уже есть. Смету соберём в КП, не на калькуляторе.</p><p><a class="btn btn-primary" href="#kp">Запросить КП</a></p></article>
    <article class="card"><h2>Промышленность</h2><p>Предприятию нужна вода на технологию или питьевое снабжение объекта. Требования к качеству и к узлу разные, их не смешиваем в одну фразу «скважина на воду». Лицензия компании покрывает и питьевое снабжение, и технологическое обеспечение промышленности — см. страницу документов.</p><p><a class="btn btn-primary" href="#kp">Запросить КП</a></p></article>
    <article class="card"><h2>Муниципалитеты</h2><p>Водоснабжение поселения или локальный узел. Договор подряда, СРО, конкурентные процедуры в пределах ответственности по реестру. Срок всего цикла и дебит «как у соседей» не обещаем.</p><p><a class="btn btn-primary" href="#kp">Запросить КП</a></p></article>
  </div></section>
  <section class="section section-muted"><div class="container">
    <h2>Объекты</h2>
    <p>Те же карточки, что на главной: без выдуманных дебитов. Сюда встанут свежие объекты. Старые контракты 2012–2014 годов специально не публикуем.</p>
    ${cases("")}
  </div></section>
  <section class="section" id="kp"><div class="container"><h2>Запросить КП</h2><div class="form-card">${formBlock("", "")}</div></div></section>`;
  writeContent(file, "Это тексты страницы ОТРАСЛИ.", bag);
  writePage(
    "otrasli.html",
    layout({
      title: "Водозаборы для ферм, промышленности и муниципалитетов — Бурводстрой",
      description:
        "Водозаборы ООО «БУРВОДСТРОЙ» для ферм, агрохолдингов, промышленности и муниципалитетов Тамбовской области. Запрос КП без цены за метр.",
      canonical: "otrasli.html",
      page: "otrasli",
      contentFile: file,
      body,
    }),
  );
}

function buildContacts() {
  const bag = {};
  const file = "kontakty.js";
  const body = `<section class="page-hero"><div class="container">
    ${T(bag, file, "h1", "Контакты", "h1", "")}
    ${T(bag, file, "lead", "Напишите или позвоните в рабочие часы, пн–пт с 08:00 до 17:00. Если пишете в выходной, оставьте заявку — ответим в ближайший рабочий день.", "p", "lead")}
  </div></section>
  <section class="section"><div class="container split">
    <div class="req-card">
      <h2>Телефоны и почта</h2>
      <p>Основной: <a href="tel:+74752454917">${PHONE}</a></p>
      <p>Дополнительный: <a href="tel:+74752455995">+7 (4752) 45-59-95</a></p>
      <p>${PHONES_OK}</p>
      <p>Мобильный: ${MOBILE}</p>
      <p>Email: <a href="mailto:bvs_tam@mail.ru">bvs_tam@mail.ru</a></p>
      <p>Режим: пн–пт 08:00–17:00, сб–вс выходной.</p>
      <p>WhatsApp: ${WA}<br>Telegram: ${TG}</p>
      <h2>Два адреса, не склеиваем</h2>
      <p><strong>${ADDR}</strong> — юридический и фактический по ЕГРЮЛ, реестру СРО, старому сайту и карточке <a href="https://2gis.ru/tambov/firm/11400264837762658">2ГИС</a>. В карточке 2ГИС есть пометка, что данные давно не обновляли.</p>
      <p>Яндекс.Карты показывают другой адрес: г. Тамбов, Заводской проезд, д. 20, тот же телефон и сайт bvs68.ru.</p>
      <p>${ADDR_NOTE}</p>
      <p class="fine">Карта ниже стоит по точке «Тамбов, ул. Заводская, 52». ${"Перед визитом уточните адрес: в разных справочниках указаны два адреса"}.</p>
      <h2>Реквизиты</h2>
      <p>ООО «БУРВОДСТРОЙ», ИНН 6829140201, КПП 682901001, ОГРН 1186820001543, ОКПО 25309655. Директор: Батищев Михаил Вячеславович.</p>
      <p>Лицензия на пользование недрами № ТМБ 80356 ВЭ, срок до 25.06.2028. СРО № 60, <a href="https://stroytambov.ru/reestr/view?id=10">реестр</a>.</p>
      <p>Прежние сайты: <a href="http://bvs68.ru">bvs68.ru</a>, <a href="http://бурводстрой68.рф">бурводстрой68.рф</a>. Новый сайт их заменяет. Сейчас они бывают без нормального HTTPS и недоступны.</p>
    </div>
    <div>
      <iframe class="map-frame" title="Карта: Тамбов, ул. Заводская, 52. Перед визитом уточните адрес." width="600" height="400" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://yandex.ru/map-widget/v1/?text=%D0%A2%D0%B0%D0%BC%D0%B1%D0%BE%D0%B2%2C%20%D1%83%D0%BB.%20%D0%97%D0%B0%D0%B2%D0%BE%D0%B4%D1%81%D0%BA%D0%B0%D1%8F%2C%2052&z=16"></iframe>
      <p>Перед визитом уточните адрес: в разных справочниках указаны два адреса.</p>
    </div>
  </div></section>
  <section class="section section-muted" id="kp"><div class="container">
    <h2>Запрос КП</h2>
    <div class="form-card">${formBlock("Тамбов", "")}</div>
    <p><button class="btn btn-ghost js-open-kp" type="button">Открыть бота заявки</button></p>
  </div></section>`;
  writeContent(file, "Это тексты страницы КОНТАКТЫ.", bag);
  writePage(
    "kontakty.html",
    layout({
      title: "Контакты Бурводстрой в Тамбове",
      description:
        "ООО «БУРВОДСТРОЙ»: +7 (4752) 45-49-17, bvs_tam@mail.ru, пн–пт 08:00–17:00. Адрес ул. Заводская, 52 и отметка, что в Яндекс.Картах указан Заводской проезд, 20.",
      canonical: "kontakty.html",
      page: "kontakty",
      contentFile: file,
      body,
      jsonLd,
    }),
  );
}

function buildPrivacy() {
  const bag = {};
  const file = "privacy.js";
  const body = `<section class="page-hero"><div class="container prose">
    ${T(bag, file, "h1", "Политика конфиденциальности", "h1", "")}
    ${T(bag, file, "p1", "Оператор персональных данных — ООО «БУРВОДСТРОЙ», ИНН 6829140201, КПП 682901001, ОГРН 1186820001543, адрес: 392018, г. Тамбов, ул. Заводская, д. 52, email bvs_tam@mail.ru. Регистрация в реестре операторов: 68-18-001854.", "p", "")}
    ${T(bag, file, "p2", "Форма и бот коммерческого предложения могут запросить: организацию, ИНН, имя контактного лица, телефон, email, район, тип объекта, объём в м³/сутки, назначение воды, задачу, сведения об имеющихся документах и желаемые сроки.", "p", "")}
    ${T(bag, file, "p3", "Данные нужны, чтобы подготовить коммерческое предложение и связаться с вами. Заявка отправляется письмом на ggbolfghjab@yandex.ru через сервис Web3Forms (api.web3forms.com). На сервере сайта заявки не хранятся. Когда будут заполнены контакты WhatsApp или Telegram, вместо письма можно открыть сообщение в мессенджере. Третьим лицам эти сведения не продаём.", "p", "")}
    ${T(bag, file, "p4", "Храним обращение, пока готовим ответ и пока этого требует закон. Согласие можно отозвать: напишите на bvs_tam@mail.ru или позвоните +7 (4752) 45-49-17 и попросите не использовать данные заявки.", "p", "")}
    ${T(bag, file, "p5", "Сайт не собирает цену, не ведёт калькулятор и не просит данные частного домовладения. Пока номер счётчика Яндекс Метрики не указан, счётчик не загружается.", "p", "")}
  </div></section>`;
  writeContent(file, "Это тексты ПОЛИТИКИ конфиденциальности.", bag);
  writePage(
    "privacy.html",
    layout({
      title: "Политика конфиденциальности — Бурводстрой",
      description:
        "Политика ООО «БУРВОДСТРОЙ»: какие данные берут форма и бот КП, зачем, как отозвать согласие. ИНН 6829140201, реестр операторов 68-18-001854.",
      canonical: "privacy.html",
      page: "privacy",
      contentFile: file,
      body,
    }),
  );
}

function buildDistrict(cfg) {
  const bag = {};
  const file = cfg.file;
  const body = `<section class="page-hero"><div class="container prose">
    ${T(bag, file, "h1", cfg.h1, "h1", "")}
    ${T(bag, file, "p1", cfg.p1, "p", "")}
    ${T(bag, file, "p2", cfg.p2, "p", "")}
    ${T(bag, file, "p3", cfg.p3, "p", "")}
  </div></section>
  <section class="section" id="kp"><div class="container split">
    <div>
      <h2>Как запросить КП</h2>
      <p>Город в форме уже подставлен, при необходимости допишите село или площадку. Точную стоимость назовём в коммерческом предложении. Цены за метр и калькулятора нет.</p>
      <div class="form-card">${formBlock(cfg.place, "../")}</div>
    </div>
    <aside class="card">
      <h2>Коротко о составе</h2>
      <ul class="check">
        <li>изыскания и проект;</li>
        <li>лицензирование недропользования, если оно нужно объекту;</li>
        <li>бурение и обустройство ВЗУ;</li>
        <li>паспорт скважины;</li>
        <li>ЗСО и сервис — с пометками на странице документов.</li>
      </ul>
      <p><a href="../dokumenty.html">Документы легального водозабора</a></p>
      <p><a href="../uslugi.html">Полный состав работ</a></p>
    </aside>
  </div></section>
  <section class="section section-muted"><div class="container faq">
    <h2>Вопросы по району</h2>
    <details open><summary data-field="q1">${esc(cfg.q1)}</summary><p data-field="a1">${esc(cfg.a1)}</p></details>
    <details><summary data-field="q2">${esc(cfg.q2)}</summary><p data-field="a2">${esc(cfg.a2)}</p></details>
    <details><summary data-field="q3">${esc(cfg.q3)}</summary><p data-field="a3">${esc(cfg.a3)}</p></details>
    <details><summary data-field="q4">${esc(cfg.q4)}</summary><p data-field="a4">${esc(cfg.a4)}</p></details>
  </div></section>`;
  bag.q1 = cfg.q1;
  bag.a1 = cfg.a1;
  bag.q2 = cfg.q2;
  bag.a2 = cfg.a2;
  bag.q3 = cfg.q3;
  bag.a3 = cfg.a3;
  bag.q4 = cfg.q4;
  bag.a4 = cfg.a4;
  writeContent(file, cfg.comment, bag);
  writePage(
    cfg.path,
    layout({
      asset: "../",
      title: cfg.title,
      description: cfg.description,
      canonical: cfg.slug + ".html",
      page: cfg.page,
      contentFile: file,
      place: cfg.place,
      body,
    }),
  );
}

buildHome();
buildUslugi();
buildDocs();
buildOtrasli();
buildContacts();
buildPrivacy();

buildDistrict({
  file: "rayony-michurinsk.js",
  path: "rayony/michurinsk.html",
  page: "michurinsk",
  slug: "michurinsk",
  place: "Мичуринск",
  comment: "Это тексты страницы МИЧУРИНСК.",
  title: "Водозабор для хозяйств Мичуринска — Бурводстрой",
  description:
    "Водозабор под ключ для хозяйств и предприятий Мичуринска и Мичуринского района. Договор, лицензия, ВЗУ, паспорт скважины. Бурводстрой, Тамбов.",
  h1: "Водозабор для хозяйств и предприятий Мичуринска и района",
  p1: "Мичуринск известен садоводством, питомниками и переработкой, а район вокруг — хозяйствами, которым вода нужна на производство и содержание животных, а не на один кран. Мы базируемся в Тамбове и выезжаем сюда с договором подряда: изыскания, проект, лицензирование недропользования, бурение, водозаборный узел и паспорт скважины.",
  p2: "Глубину «типичную для Мичуринского района» и чужой дебит не публикуем. Заявка начинается с организации, места площадки и нужных м³/сутки. Если документов ещё нет, так и напишите: это нормальная точка старта, а не повод обещать срок лицензии.",
  p3: "Точную стоимость назовём в коммерческом предложении после заявки. Отдельной цены за метр на сайте нет. Страница для хозяйств и предприятий района.",
  q1: "С чего начать хозяйству в Мичуринском районе?",
  a1: "Коротко опишите организацию, где площадка и какой расход в м³/сутки нужен. Если цифры расхода ещё нет, напишите, для чего вода: поение, переработка, полив производства. Мы не подставляем «среднюю скважину района».",
  q2: "Какие исходные данные нужны?",
  a2: "Населённый пункт, тип объекта, желаемый объём, назначение воды, сроки и список документов, которые уже есть: ничего, проект, лицензия, паспорт или иное. ИНН ускоряет КП, но без него заявку тоже примем.",
  q3: "Что с площадкой под Мичуринском?",
  a3: "Нужны подъезд, свободная высота не менее 10 м под мачту, ровная площадка минимум 4×10 м и электричество 220 В на 3 кВт. Это условия со старого сайта компании, не особые «мичуринские нормы».",
  q4: "Как оставить заявку?",
  a4: "Форма на этой странице, кнопка бота «Запрос КП» или звонок +7 (4752) 45-49-17 в пн–пт с 08:00 до 17:00. Письмо откроется у вас на компьютере, на сервер само ничего не уходит.",
});

buildDistrict({
  file: "rayony-rasskazovo.js",
  path: "rayony/rasskazovo.html",
  page: "rasskazovo",
  slug: "rasskazovo",
  place: "Рассказово",
  comment: "Это тексты страницы РАССКАЗОВО.",
  title: "Водозабор для предприятий Рассказово — Бурводстрой",
  description:
    "Легальный водозабор для предприятий и хозяйств Рассказово и Рассказовского района. Запрос КП в ООО «БУРВОДСТРОЙ», Тамбов.",
  h1: "Водозабор для хозяйств и предприятий Рассказово и района",
  p1: "Рассказово — город с предприятиями и район с сельхозплощадками вокруг. Водозабор под ключ здесь значит то же, что по области: источник с договором и документами, а не только пробурённый ствол. Выезжаем из Тамбова, пн–пт.",
  p2: "Если объект за чертой города, в заявке напишите населённый пункт и как подъехать технике. Мы не обещаем, что буровая «всегда проходит»: заранее смотрим высоту под мачту, площадку 4×10 м и сеть 220 В, 3 кВт.",
  p3: "Стоимость после заявки, в коммерческом предложении. Калькулятора нет. Для муниципальной площадки и для хозяйства набор смысла один: законная вода в нужных м³/сутки, паспорт скважины и понятный договор.",
  q1: "С чего начать в Рассказовском районе?",
  a1: "Пришлите карточку организации и точку на карте словами: город, село или промплощадка. Дальше — расход. Без этих двух вещей КП будет гаданием, а мы его не гадаем.",
  q2: "Какие исходные данные нужны?",
  a2: "м³/сутки, место, тип объекта, назначение воды и что уже есть из документов. Если лицензии нет, не нужно её «дорисовывать» в письме.",
  q3: "Площадка на краю района — это проблема?",
  a3: "Проблема только если нет подъезда, высоты 10 м или ровной площадки. Напишите об этом сразу, чтобы не закладывать выезд вслепую. Среднюю глубину по району не называем.",
  q4: "Как оставить заявку?",
  a4: "Форма ниже уже с городом «Рассказово». Можно открыть бота КП или позвонить +7 (4752) 45-49-17. В выходные заявка дождётся рабочего дня.",
});

buildDistrict({
  file: "rayony-morshansk.js",
  path: "rayony/morshansk.html",
  page: "morshansk",
  slug: "morshansk",
  place: "Моршанск",
  comment: "Это тексты страницы МОРШАНСК.",
  title: "Водозабор для хозяйств Моршанска — Бурводстрой",
  description:
    "Водозабор под ключ для хозяйств, предприятий и объектов водоснабжения Моршанска и Моршанского района. ООО «БУРВОДСТРОЙ».",
  h1: "Водозабор для хозяйств и предприятий Моршанска и района",
  p1: "Моршанск — север области, дорога из Тамбова длиннее, чем до ближних городов. Поэтому в заявке особенно важны подъезд и готовность площадки, а не «средняя глубина по Моршанску»: такой цифры у нас нет и мы её не выдумываем.",
  p2: "Работаем и с хозяйствами района, и с предприятиями города, и с задачами водоснабжения поселений. Договор, при необходимости лицензирование недропользования, бурение, ВЗУ и паспорт скважины. Лицензия компании — № ТМБ 80356 ВЭ до 25.06.2028, членство в СРО — реестр № 60.",
  p3: "Точную стоимость назовём в коммерческом предложении. Срок 1–3 дня относится только к бурению при подходящем грунте и погоде, не ко всему пути от заявки до паспорта.",
  q1: "С чего начать на севере области?",
  a1: "Напишите организацию и где именно объект: Моршанск или населённый пункт района. Добавьте, нужен ли выезд в ближайшие недели или задача плановая.",
  q2: "Какие исходные данные нужны?",
  a2: "Расход в м³/сутки, назначение, сроки, имеющиеся документы и контакт. Если расход неизвестен, опишите поголовье, технологию или число абонентов своими словами — переведём в задачу для КП, без выдуманного дебита.",
  q3: "Что проверить на площадке до выезда?",
  a3: "Подъездные пути, 10 м свободной высоты, площадку 4×10 м и 3 кВт от сети 220 В. Зимой и в распутицу лучше честно написать про дорогу.",
  q4: "Как оставить заявку?",
  a4: "Форма на странице, бот «Запрос КП» или телефон +7 (4752) 45-49-17. Дополнительный номер +7 (4752) 45-59-95. Письмо собирается у вас, мы не пишем «заявка отправлена», если почтовая программа не открылась.",
});

buildDistrict({
  file: "rayony-kotovsk.js",
  path: "rayony/kotovsk.html",
  page: "kotovsk",
  slug: "kotovsk",
  place: "Котовск",
  comment: "Это тексты страницы КОТОВСК.",
  title: "Водозабор для предприятий Котовска — Бурводстрой",
  description:
    "Водозабор под ключ для предприятий и хозяйств Котовска и окрестностей. Запрос коммерческого предложения, ООО «БУРВОДСТРОЙ», Тамбов.",
  h1: "Водозабор для хозяйств и предприятий Котовска и окрестностей",
  p1: "Котовск рядом с Тамбовом, но заявка оформляется так же, как по области: организация, объект, нужные м³/сутки. Близость к городу не отменяет лицензионный контур и паспорт скважины.",
  p2: "Промышленной площадке чаще нужна вода и на технологию, и на людей — это разные требования к качеству и к документам. Окрестности Котовска — хозяйства, которым нужен легальный водозабор на производство, а не разовый ствол без бумаг.",
  p3: "Стоимость — только в КП после заявки. Цену на сайте не публикуем. Старые муниципальные контракты 2012–2014 годов как актуальные кейсы не размещаем.",
  q1: "С чего начать предприятию в Котовске?",
  a1: "Опишите площадку и для чего вода: технология, питьё персонала или оба контура. От этого зависит, какие документы обсуждать, а не метраж «на глаз».",
  q2: "Какие исходные данные нужны?",
  a2: "Место, м³/сутки, сроки, уже имеющиеся проект, лицензия или паспорт. Если ничего нет — отметьте «ничего», это честнее, чем пустое поле.",
  q3: "Площадка внутри промзоны — что учесть?",
  a3: "Те же четыре пункта: подъезд, высота 10 м под мачту, ровная площадка 4×10 м, электричество 3 кВт. Стеснённый проезд между цехами лучше описать сразу.",
  q4: "Как оставить заявку?",
  a4: "Форма с городом «Котовск», бот на кнопке «Написать нам» или звонок +7 (4752) 45-49-17. Режим офиса: пн–пт 08:00–17:00.",
});

const urls = [
  "/",
  "/uslugi.html",
  "/dokumenty.html",
  "/otrasli.html",
  "/kontakty.html",
  "/privacy.html",
  "/rayony/michurinsk.html",
  "/rayony/rasskazovo.html",
  "/rayony/morshansk.html",
  "/rayony/kotovsk.html",
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${DOMAIN}
     В каждом loc замените «[ЗАПОЛНИТЬ: боевой домен]» на https-адрес без слэша на конце.
     Пример хоста в loc не подставляется. Главная — один раз, без /index.html. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>[ЗАПОЛНИТЬ: боевой домен]${u}</loc></url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);
fs.writeFileSync(
  path.join(root, "robots.txt"),
  "User-agent: *\nAllow: /\n\n# Карта сайта: /sitemap.xml. Директиву Sitemap добавьте, когда будет известен https-домен.\n",
);
console.log("pages written");
