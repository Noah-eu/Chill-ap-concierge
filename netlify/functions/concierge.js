// netlify/functions/concierge.js
// Čistě deterministická logika — bez OpenAI / bez externích AI volání.

import { PLACES } from "./data/places.js";
import {
  getContentPack,
  assistantSentWifiTroubleshoot,
  assistantMessageContainsKeyHelp,
} from "./i18n-content.js";

/** ====== LOKÁLNÍ DATA ====== */
const HOTEL = {
  address: "Sokolská 1614/64, Praha 2, 120 00",
  areaHints: [
    "I. P. Pavlova (3–5 min pěšky)",
    "Náměstí Míru (10–12 min pěšky / 1 stanice tram)",
    "Muzeum / Václavské náměstí (10–12 min pěšky)"
  ],
  maxRadiusMeters: 800
};
const NEARBY_RADIUS = 200;

const WIFI = [
  { room: "001", ssid: "D384", pass: "07045318" },
  { room: "101", ssid: "CDEA", pass: "51725587" },
  { room: "102", ssid: "CF2A", pass: "09341791" },
  { room: "103", ssid: "93EO", pass: "25133820" },
  { room: "104", ssid: "D93A", pass: "10661734" },
  { room: "105", ssid: "D9E4", pass: "09464681" },
  { room: "201", ssid: "6A04", pass: "44791957" },
  { room: "202", ssid: "9B7A", pass: "65302361" },
  { room: "203", ssid: "1CF8", pass: "31284547" },
  { room: "204", ssid: "D8C4", pass: "73146230" },
  { room: "205", ssid: "CD9E", pass: "02420004" },
  { room: "301", ssid: "CF20", pass: "96995242" },
  { room: "302", ssid: "23F0", pass: "46893345" },
  { room: "303", ssid: "B4B4", pass: "07932908" },
  { room: "304", ssid: "DA4E", pass: "03274644" },
  { room: "305", ssid: "D5F6", pass: "45445804" },
];

const KEYBOX = {
  "001": "3301", "101": "3302", "102": "3303", "103": "3304", "104": "3305", "105": "3306",
  "201": "3307", "202": "3308", "203": "3309", "204": "3310", "205": "3311",
  "301": "3312", "302": "3313", "303": "3314", "304": "3315", "305": "3316",
};

/** ====== Krátké texty podle jazyka UI (handoff, chyby, Wi‑Fi dotaz) ====== */
const UI_STRINGS = {
  cs: {
    handoff:
      "Tyto informace zde nevyřizuji. Napište prosím přímo Davidovi (WhatsApp +420 733 439 733). " +
      "Rád pomohu s ostatním (restaurace, doprava, doporučení v okolí, technické potíže mimo kódy).",
    ack: "Rozumím.",
    wifiAsk: "Napište prosím **číslo apartmánu** nebo **SSID** (4 znaky) – pošlu heslo.",
    errorGeneric: "Omlouvám se, nastala chyba. Zkuste to prosím znovu.",
    errorInvalidJson: "Neplatný JSON v požadavku.",
  },
  en: {
    handoff:
      "I can't handle this topic here. Please message David directly (WhatsApp +420 733 439 733). " +
      "I can help with restaurants, transport, nearby tips, and technical topics that don't need private codes.",
    ack: "Understood.",
    wifiAsk: "Please send your **apartment number** or **SSID** (4 characters) — I'll send the password.",
    errorGeneric: "Sorry, something went wrong. Please try again.",
    errorInvalidJson: "Invalid JSON in the request.",
  },
  es: {
    handoff:
      "No gestiono este tema aquí. Escribe a David (WhatsApp +420 733 439 733). " +
      "Puedo ayudar con restaurantes, transporte, consejos cercanos y temas técnicos sin códigos privados.",
    ack: "Entendido.",
    wifiAsk: "Envía tu **número de apartamento** o **SSID** (4 caracteres) — te envío la contraseña.",
  },
  de: {
    handoff:
      "Das kann ich hier nicht klären. Bitte schreib David direkt (WhatsApp +420 733 439 733). " +
      "Ich helfe bei Restaurants, Transport, Tipps in der Nähe und technischen Themen ohne private Codes.",
    ack: "Verstanden.",
    wifiAsk: "Bitte **Apartmentnummer** oder **SSID** (4 Zeichen) senden — dann schicke ich das Passwort.",
  },
  fr: {
    handoff:
      "Je ne traite pas ce sujet ici. Écrivez à David (WhatsApp +420 733 439 733). " +
      "Je peux aider pour les restaurants, transports, conseils à proximité et sujets techniques sans codes privés.",
    ack: "Compris.",
    wifiAsk: "Envoyez le **numéro d’appartement** ou le **SSID** (4 caractères) — j’enverrai le mot de passe.",
  },
  ru: {
    handoff:
      "Этот вопрос здесь не оформляю. Напишите Давиду (WhatsApp +420 733 439 733). " +
      "Помогу с ресторанами, транспортом, советами рядом и техническими темами без личных кодов.",
    ack: "Понял(а).",
    wifiAsk: "Напишите **номер апартамента** или **SSID** (4 символа) — пришлю пароль.",
  },
  uk: {
    handoff:
      "Тут це не оформлюю. Напишіть Давиду (WhatsApp +420 733 439 733). " +
      "Допоможу з ресторанами, транспортом, порадами поруч і технічними питаннями без приватних кодів.",
    ack: "Зрозуміло.",
    wifiAsk: "Напишіть **номер апартаменту** або **SSID** (4 символи) — надішлю пароль.",
  },
  nl: {
    handoff:
      "Dit kan ik hier niet afhandelen. Stuur David een bericht (WhatsApp +420 733 439 733). " +
      "Ik help met restaurants, vervoer, tips in de buurt en technische zonder privécodes.",
    ack: "Begrepen.",
    wifiAsk: "Stuur je **appartementsnummer** of **SSID** (4 tekens) — dan stuur ik het wachtwoord.",
  },
  it: {
    handoff:
      "Non gestisco questo qui. Scrivi a David (WhatsApp +420 733 439 733). " +
      "Posso aiutare con ristoranti, trasporti, consigli vicini e argomenti tecnici senza codici privati.",
    ack: "Capito.",
    wifiAsk: "Invia il **numero dell’appartamento** o l’**SSID** (4 caratteri) — ti mando la password.",
  },
  da: {
    handoff:
      "Det kan jeg ikke klare her. Skriv til David (WhatsApp +420 733 439 733). " +
      "Jeg hjælper med restauranter, transport, tips i nærheden og tekniske emner uden private koder.",
    ack: "Forstået.",
    wifiAsk: "Send dit **lejlighedsnummer** eller **SSID** (4 tegn) — så sender jeg adgangskoden.",
  },
  pl: {
    handoff:
      "Tego nie załatwiam tutaj. Napisz do Davida (WhatsApp +420 733 439 733). " +
      "Pomogę w kwestiach restauracji, transportu, tipów w pobliżu i technicznych bez prywatnych kodów.",
    ack: "Rozumiem.",
    wifiAsk: "Podaj **numer apartamentu** lub **SSID** (4 znaki) — wyślę hasło.",
  },
};

function normUiLang(uiLang) {
  const c = String(uiLang || "").toLowerCase();
  return UI_STRINGS[c] ? c : "cs";
}

function T(uiLang, key) {
  const pack = UI_STRINGS[normUiLang(uiLang)];
  return pack[key] || UI_STRINGS.en[key] || UI_STRINGS.cs[key] || "";
}

/** ====== BLOKACE TÉMAT ====== */
const FORBIDDEN_PATTERNS = [
  /parkován(í|i)|parking/i,
  /check[-\s]?in|self\s?check[-\s]?in|check[-\s]?out|late check[-\s]?out/i,
  /ubytován(í|i)|rezervac(e|i|í)/i,
  /(cena|price).*(pokoj|room)|platba za (ubytování|pokoj)/i
];

/** ====== UTIL ====== */
const lastUser = (messages = []) => [...messages].reverse().find(m => m.role === "user")?.content || "";
const lastAssistant = (messages = []) => [...messages].reverse().find(m => m.role === "assistant")?.content || "";

// tolerantní detekce čísla pokoje (apt/room/#/č.)
const extractRoom = (text = "") => {
  const m = String(text).toLowerCase()
    .match(/(?:room|apt|ap\.?|apartm[áa]n|pokoj|č\.)?\s*#?\s*(00[1]|10[1-5]|20[1-5]|30[1-5])\b/);
  return m?.[1] || null;
};
const extractSSID = (text = "") => (text || "").match(/\b([A-Z0-9]{4})\b/)?.[1] || null;

function historyContainsWifi(messages = []) {
  const look = messages.slice(-6).map(m => (m.content || "").toLowerCase()).join(" ");
  return /(wi[-\s]?fi|wifi|ssid|router|heslo|password)/i.test(look);
}
function historyContainsKeys(messages = []) {
  const look = messages.slice(-6).map(m => (m.content || "").toLowerCase()).join(" ");
  return /(náhradn|spare\s+key|zapomenut[ýy]\s+kl[ií]č|key[-\s]?box|schránk)/i.test(look);
}
function recentlySentWifiTroubleshoot(messages = []) {
  return assistantSentWifiTroubleshoot(lastAssistant(messages));
}

/** ====== IMG PATHS ====== */
const IMG = (src) => src;
const P = {
  AC: "/help/AC.jpg",
  BALCONY: "/help/balcony.jpg",
  FUSE_APT: "/help/fuse-box-apartment.jpg",
  FUSE_IN_APT: "/help/fuse-box-in-the-apartment.jpg",
  LAUNDRY: "/help/laundry-room.jpg",
  LUGGAGE: "/help/luggage-room.jpg",
  CHECKOUT_BOX: "/help/check-out-box.jpg",
  SPARE_KEY: "/help/spare-key.jpg",
  GARBAGE: "/help/garbage.jpg",
  DOOR_BELLS: "/help/door-bells.jpg",
  ENTRY_DIAL: "/help/entry-dialer.jpg",
  KEYBOX_WALL: "/help/key-box-wall.jpg",
  KEY_BOX: "/help/key-box.jpg",
  MAIN_ENTRANCE: "/help/11.%20Main%20entrance.jpg",
  ELEVATOR: "/help/elevator.jpg",
  FLOOR_HALL: "/help/floor-hall.jpg",
  ROOM_DOOR: "/help/room-door.jpg",
  ENTRANCE: "/help/entrance.jpg",
  DIALER: "/help/dialer.jpg",
};

const STAY_INSTRUCTIONS_BY_LANG = {
  en: [
    "### Check-in & Keys",
    "",
    "Check-in: from 14:00 (earlier if ready).",
    "If you arrive before 11:00, please use the luggage room next to the key boxes. The code was sent to you in your arrival instructions.",
    "",
    "%%IMG_LUGGAGE%%",
    "",
    "After 11:00:",
    "If your apartment is already cleaned, you may stay in the apartment.",
    "If not yet cleaned, you may leave your luggage inside and return later.",
    "",
    "Entrance to the building from the parking lot: the code was sent to you in your arrival instructions.",
    "",
    "%%IMG_ENTRANCE%%",
    "%%IMG_DIALER%%",
    "",
    "Key box: inside the building, on the right-hand side after entering through the main entrance.",
    "The box number and code were sent to you in your arrival instructions.",
    "Inside: apartment key.",
    "Please close the box after taking the key and do not use it for storage during your stay.",
    "",
    "%%IMG_KEY_BOX%%",
    "",
    "The step-by-step guide with photos is available in the Chill Concierge App.",
    "",
    "### Check-out & Luggage",
    "",
    "Check-out: by 11:00 AM.",
    "Please make sure to leave the apartment no later than 11:00.",
    "We are fully booked most days, with new guests arriving early, so unfortunately late check-out is not possible.",
    "",
    "Please drop your key into the white mailbox in the ground floor hallway, across from the elevator, on the left-hand side after entering the main entrance.",
    "",
    "%%IMG_CHECKOUT_BOX%%",
    "",
    "You can still use the luggage room after check-out if needed.",
    "Full instructions with photos are available in the Concierge app above.",
  ].join("\n"),
  cs: [
    "### Check-in a klíče",
    "",
    "Check-in: od 14:00 (dříve, pokud bude apartmán připravený).",
    "Pokud přijedete před 11:00, použijte prosím úschovnu zavazadel vedle key boxů. Kód jsme vám poslali v příjezdových instrukcích.",
    "",
    "%%IMG_LUGGAGE%%",
    "",
    "Po 11:00:",
    "Pokud je váš apartmán už uklizený, můžete v něm zůstat.",
    "Pokud ještě uklizený není, můžete si v něm nechat zavazadla a vrátit se později.",
    "",
    "Vstup do budovy z parkoviště: kód jsme vám poslali v příjezdových instrukcích.",
    "",
    "%%IMG_ENTRANCE%%",
    "%%IMG_DIALER%%",
    "",
    "Key box: uvnitř budovy, po pravé straně po vstupu hlavním vchodem.",
    "Číslo boxu a kód jsme vám poslali v příjezdových instrukcích.",
    "Uvnitř je klíč od apartmánu.",
    "Po vyzvednutí klíče prosím box zavřete a nepoužívejte ho během pobytu jako úložný prostor.",
    "",
    "%%IMG_KEY_BOX%%",
    "",
    "Podrobný návod s fotografiemi najdete v aplikaci Chill Concierge.",
    "",
    "### Check-out a zavazadla",
    "",
    "Check-out: do 11:00.",
    "Prosíme, opusťte apartmán nejpozději v 11:00.",
    "Většinu dní jsme plně obsazeni a další hosté přijíždějí brzy, proto bohužel není možný pozdní check-out.",
    "",
    "Klíč prosím vhoďte do bílé schránky v chodbě v přízemí, naproti výtahu, po levé straně po vstupu hlavním vchodem.",
    "",
    "%%IMG_CHECKOUT_BOX%%",
    "",
    "Po check-outu můžete v případě potřeby stále využít úschovnu zavazadel.",
    "Kompletní instrukce s fotografiemi najdete výše v aplikaci Concierge.",
  ].join("\n"),
  de: [
    "### Check-in & Schlüssel",
    "",
    "Check-in: ab 14:00 Uhr (früher, falls das Apartment bereits fertig ist).",
    "Wenn Sie vor 11:00 Uhr ankommen, nutzen Sie bitte den Gepäckraum neben den Schlüsselboxen. Den Code haben wir Ihnen in den Anreiseinformationen gesendet.",
    "",
    "%%IMG_LUGGAGE%%",
    "",
    "Nach 11:00 Uhr:",
    "Wenn Ihr Apartment bereits gereinigt ist, können Sie im Apartment bleiben.",
    "Wenn es noch nicht gereinigt ist, können Sie Ihr Gepäck dort abstellen und später zurückkommen.",
    "",
    "Eingang zum Gebäude vom Parkplatz: Den Code haben wir Ihnen in den Anreiseinformationen gesendet.",
    "",
    "%%IMG_ENTRANCE%%",
    "%%IMG_DIALER%%",
    "",
    "Schlüsselbox: im Gebäude, auf der rechten Seite nach dem Betreten durch den Haupteingang.",
    "Die Nummer der Box und den Code haben wir Ihnen in den Anreiseinformationen gesendet.",
    "In der Box befindet sich der Apartmentschlüssel.",
    "Bitte schließen Sie die Box nach der Entnahme des Schlüssels und nutzen Sie sie während Ihres Aufenthalts nicht als Aufbewahrungsort.",
    "",
    "%%IMG_KEY_BOX%%",
    "",
    "Die Schritt-für-Schritt-Anleitung mit Fotos finden Sie in der Chill Concierge App.",
    "",
    "### Check-out & Gepäck",
    "",
    "Check-out: bis 11:00 Uhr.",
    "Bitte verlassen Sie das Apartment spätestens um 11:00 Uhr.",
    "Wir sind an den meisten Tagen ausgebucht und neue Gäste reisen früh an, daher ist ein später Check-out leider nicht möglich.",
    "",
    "Bitte werfen Sie den Schlüssel in den weißen Briefkasten im Flur im Erdgeschoss, gegenüber dem Aufzug, auf der linken Seite nach dem Betreten durch den Haupteingang.",
    "",
    "%%IMG_CHECKOUT_BOX%%",
    "",
    "Sie können den Gepäckraum bei Bedarf auch nach dem Check-out nutzen.",
    "Die vollständige Anleitung mit Fotos finden Sie oben in der Concierge App.",
  ].join("\n"),
  es: [
    "### Check-in y llaves",
    "",
    "Check-in: desde las 14:00 (antes si el apartamento ya está listo).",
    "Si llega antes de las 11:00, utilice la sala de equipaje junto a las cajas de llaves. El código se le envió en las instrucciones de llegada.",
    "",
    "%%IMG_LUGGAGE%%",
    "",
    "Después de las 11:00:",
    "Si su apartamento ya está limpio, puede quedarse dentro.",
    "Si aún no está limpio, puede dejar allí su equipaje y volver más tarde.",
    "",
    "Entrada al edificio desde el aparcamiento: el código se le envió en las instrucciones de llegada.",
    "",
    "%%IMG_ENTRANCE%%",
    "%%IMG_DIALER%%",
    "",
    "Caja de llaves: dentro del edificio, a la derecha después de entrar por la entrada principal.",
    "El número de la caja y el código se le enviaron en las instrucciones de llegada.",
    "Dentro encontrará la llave del apartamento.",
    "Por favor, cierre la caja después de recoger la llave y no la utilice como almacenamiento durante su estancia.",
    "",
    "%%IMG_KEY_BOX%%",
    "",
    "La guía paso a paso con fotos está disponible en la aplicación Chill Concierge.",
    "",
    "### Check-out y equipaje",
    "",
    "Check-out: hasta las 11:00.",
    "Por favor, asegúrese de salir del apartamento como máximo a las 11:00.",
    "La mayoría de los días estamos completos y los nuevos huéspedes llegan temprano, por lo que lamentablemente no es posible hacer late check-out.",
    "",
    "Por favor, deje la llave en el buzón blanco situado en el pasillo de la planta baja, frente al ascensor, a la izquierda después de entrar por la entrada principal.",
    "",
    "%%IMG_CHECKOUT_BOX%%",
    "",
    "Si lo necesita, puede seguir utilizando la sala de equipaje después del check-out.",
    "Las instrucciones completas con fotos están disponibles arriba en la aplicación Concierge.",
  ].join("\n"),
  fr: [
    "### Arrivée et clés",
    "",
    "Arrivée : à partir de 14 h (plus tôt si l’appartement est prêt).",
    "Si vous arrivez avant 11 h, veuillez utiliser la consigne à bagages à côté des boîtes à clés. Le code vous a été envoyé dans les instructions d’arrivée.",
    "",
    "%%IMG_LUGGAGE%%",
    "",
    "Après 11 h :",
    "Si votre appartement est déjà nettoyé, vous pouvez rester dans l’appartement.",
    "S’il n’est pas encore nettoyé, vous pouvez y laisser vos bagages et revenir plus tard.",
    "",
    "Entrée du bâtiment depuis le parking : le code vous a été envoyé dans les instructions d’arrivée.",
    "",
    "%%IMG_ENTRANCE%%",
    "%%IMG_DIALER%%",
    "",
    "Boîte à clés : dans le bâtiment, sur la droite après l’entrée par l’entrée principale.",
    "Le numéro de la boîte et le code vous ont été envoyés dans les instructions d’arrivée.",
    "À l’intérieur : la clé de l’appartement.",
    "Veuillez refermer la boîte après avoir pris la clé et ne pas l’utiliser comme rangement pendant votre séjour.",
    "",
    "%%IMG_KEY_BOX%%",
    "",
    "Le guide étape par étape avec photos est disponible dans l’application Chill Concierge.",
    "",
    "### Départ et bagages",
    "",
    "Départ : avant 11 h.",
    "Veuillez quitter l’appartement au plus tard à 11 h.",
    "Nous sommes complets la plupart des jours et les nouveaux clients arrivent tôt, il n’est donc malheureusement pas possible de proposer un départ tardif.",
    "",
    "Veuillez déposer votre clé dans la boîte aux lettres blanche du couloir du rez-de-chaussée, en face de l’ascenseur, sur la gauche après l’entrée principale.",
    "",
    "%%IMG_CHECKOUT_BOX%%",
    "",
    "Vous pouvez toujours utiliser la consigne à bagages après le départ si nécessaire.",
    "Les instructions complètes avec photos sont disponibles ci-dessus dans l’application Concierge.",
  ].join("\n"),
  ru: [
    "### Заезд и ключи",
    "",
    "Заезд: с 14:00 (раньше, если апартамент уже готов).",
    "Если вы приезжаете до 11:00, пожалуйста, воспользуйтесь комнатой хранения багажа рядом с ключевыми боксами. Код был отправлен вам в инструкциях по прибытию.",
    "",
    "%%IMG_LUGGAGE%%",
    "",
    "После 11:00:",
    "Если ваш апартамент уже убран, вы можете остаться в апартаменте.",
    "Если он еще не убран, вы можете оставить багаж внутри и вернуться позже.",
    "",
    "Вход в здание со стороны парковки: код был отправлен вам в инструкциях по прибытию.",
    "",
    "%%IMG_ENTRANCE%%",
    "%%IMG_DIALER%%",
    "",
    "Ключевой бокс: внутри здания, справа после входа через главный вход.",
    "Номер бокса и код были отправлены вам в инструкциях по прибытию.",
    "Внутри: ключ от апартамента.",
    "Пожалуйста, закройте бокс после получения ключа и не используйте его для хранения вещей во время проживания.",
    "",
    "%%IMG_KEY_BOX%%",
    "",
    "Пошаговое руководство с фотографиями доступно в приложении Chill Concierge.",
    "",
    "### Выезд и багаж",
    "",
    "Выезд: до 11:00.",
    "Пожалуйста, покиньте апартамент не позднее 11:00.",
    "В большинство дней у нас полная загрузка, а новые гости приезжают рано, поэтому поздний выезд, к сожалению, невозможен.",
    "",
    "Пожалуйста, опустите ключ в белый почтовый ящик в коридоре на первом этаже, напротив лифта, слева после входа через главный вход.",
    "",
    "%%IMG_CHECKOUT_BOX%%",
    "",
    "При необходимости вы можете пользоваться комнатой хранения багажа и после выезда.",
    "Полные инструкции с фотографиями доступны выше в приложении Concierge.",
  ].join("\n"),
  uk: [
    "### Заїзд і ключі",
    "",
    "Заїзд: з 14:00 (раніше, якщо апартамент уже готовий).",
    "Якщо ви приїжджаєте до 11:00, будь ласка, скористайтеся кімнатою зберігання багажу поруч із ключовими боксами. Код було надіслано вам в інструкціях щодо прибуття.",
    "",
    "%%IMG_LUGGAGE%%",
    "",
    "Після 11:00:",
    "Якщо ваш апартамент уже прибраний, ви можете залишитися в апартаменті.",
    "Якщо його ще не прибрано, ви можете залишити багаж усередині й повернутися пізніше.",
    "",
    "Вхід до будівлі з боку паркінгу: код було надіслано вам в інструкціях щодо прибуття.",
    "",
    "%%IMG_ENTRANCE%%",
    "%%IMG_DIALER%%",
    "",
    "Ключовий бокс: всередині будівлі, праворуч після входу через головний вхід.",
    "Номер боксу та код було надіслано вам в інструкціях щодо прибуття.",
    "Усередині: ключ від апартаменту.",
    "Будь ласка, закрийте бокс після отримання ключа й не використовуйте його для зберігання речей під час проживання.",
    "",
    "%%IMG_KEY_BOX%%",
    "",
    "Покроковий гід із фотографіями доступний у застосунку Chill Concierge.",
    "",
    "### Виїзд і багаж",
    "",
    "Виїзд: до 11:00.",
    "Будь ласка, залиште апартамент не пізніше 11:00.",
    "У більшість днів у нас повне завантаження, а нові гості приїжджають рано, тому пізній виїзд, на жаль, неможливий.",
    "",
    "Будь ласка, опустіть ключ у білу поштову скриньку в коридорі на першому поверсі, навпроти ліфта, ліворуч після входу через головний вхід.",
    "",
    "%%IMG_CHECKOUT_BOX%%",
    "",
    "За потреби ви можете користуватися кімнатою зберігання багажу й після виїзду.",
    "Повні інструкції з фотографіями доступні вище в застосунку Concierge.",
  ].join("\n"),
  nl: [
    "### Inchecken & sleutels",
    "",
    "Inchecken: vanaf 14:00 (eerder als het appartement klaar is).",
    "Als je voor 11:00 aankomt, gebruik dan de bagageruimte naast de sleutelkastjes. De code is naar je verstuurd in je aankomstinstructies.",
    "",
    "%%IMG_LUGGAGE%%",
    "",
    "Na 11:00:",
    "Als je appartement al is schoongemaakt, mag je in het appartement blijven.",
    "Als het nog niet is schoongemaakt, kun je je bagage binnen laten en later terugkomen.",
    "",
    "Ingang van het gebouw vanaf de parkeerplaats: de code is naar je verstuurd in je aankomstinstructies.",
    "",
    "%%IMG_ENTRANCE%%",
    "%%IMG_DIALER%%",
    "",
    "Sleutelkastje: in het gebouw, rechts na binnenkomst via de hoofdingang.",
    "Het kastnummer en de code zijn naar je verstuurd in je aankomstinstructies.",
    "Binnenin: appartementsleutel.",
    "Sluit het kastje na het pakken van de sleutel en gebruik het tijdens je verblijf niet als opslag.",
    "",
    "%%IMG_KEY_BOX%%",
    "",
    "De stapsgewijze gids met foto's is beschikbaar in de Chill Concierge App.",
    "",
    "### Uitchecken & bagage",
    "",
    "Uitchecken: uiterlijk 11:00.",
    "Zorg ervoor dat je het appartement uiterlijk om 11:00 verlaat.",
    "We zijn de meeste dagen volgeboekt en nieuwe gasten komen vroeg aan, dus laat uitchecken is helaas niet mogelijk.",
    "",
    "Doe je sleutel in de witte brievenbus in de gang op de begane grond, tegenover de lift, links na binnenkomst via de hoofdingang.",
    "",
    "%%IMG_CHECKOUT_BOX%%",
    "",
    "Je kunt de bagageruimte indien nodig ook na het uitchecken gebruiken.",
    "De volledige instructies met foto's zijn hierboven beschikbaar in de Concierge app.",
  ].join("\n"),
  it: [
    "### Check-in e chiavi",
    "",
    "Check-in: dalle 14:00 (prima se l’appartamento è pronto).",
    "Se arrivi prima delle 11:00, usa il deposito bagagli accanto alle cassette delle chiavi. Il codice ti è stato inviato nelle istruzioni di arrivo.",
    "",
    "%%IMG_LUGGAGE%%",
    "",
    "Dopo le 11:00:",
    "Se il tuo appartamento è già pulito, puoi restare nell’appartamento.",
    "Se non è ancora pulito, puoi lasciare i bagagli all’interno e tornare più tardi.",
    "",
    "Ingresso dell’edificio dal parcheggio: il codice ti è stato inviato nelle istruzioni di arrivo.",
    "",
    "%%IMG_ENTRANCE%%",
    "%%IMG_DIALER%%",
    "",
    "Cassetta delle chiavi: dentro l’edificio, sulla destra dopo l’ingresso principale.",
    "Il numero della cassetta e il codice ti sono stati inviati nelle istruzioni di arrivo.",
    "All’interno: chiave dell’appartamento.",
    "Chiudi la cassetta dopo aver preso la chiave e non usarla come deposito durante il soggiorno.",
    "",
    "%%IMG_KEY_BOX%%",
    "",
    "La guida passo passo con foto è disponibile nell’app Chill Concierge.",
    "",
    "### Check-out e bagagli",
    "",
    "Check-out: entro le 11:00.",
    "Assicurati di lasciare l’appartamento entro e non oltre le 11:00.",
    "Siamo al completo quasi tutti i giorni e i nuovi ospiti arrivano presto, quindi purtroppo il late check-out non è possibile.",
    "",
    "Lascia la chiave nella cassetta postale bianca nel corridoio al piano terra, di fronte all’ascensore, sulla sinistra dopo l’ingresso principale.",
    "",
    "%%IMG_CHECKOUT_BOX%%",
    "",
    "Se necessario, puoi usare il deposito bagagli anche dopo il check-out.",
    "Le istruzioni complete con foto sono disponibili sopra nell’app Concierge.",
  ].join("\n"),
  da: [
    "### Indtjekning & nøgler",
    "",
    "Indtjekning: fra kl. 14.00 (tidligere hvis lejligheden er klar).",
    "Hvis du ankommer før kl. 11.00, bedes du bruge bagagerummet ved siden af nøgleboksene. Koden blev sendt til dig i dine ankomstinstruktioner.",
    "",
    "%%IMG_LUGGAGE%%",
    "",
    "Efter kl. 11.00:",
    "Hvis din lejlighed allerede er rengjort, må du blive i lejligheden.",
    "Hvis den endnu ikke er rengjort, kan du efterlade din bagage indenfor og komme tilbage senere.",
    "",
    "Indgang til bygningen fra parkeringspladsen: koden blev sendt til dig i dine ankomstinstruktioner.",
    "",
    "%%IMG_ENTRANCE%%",
    "%%IMG_DIALER%%",
    "",
    "Nøgleboks: inde i bygningen, på højre side efter indgang gennem hovedindgangen.",
    "Boksnummeret og koden blev sendt til dig i dine ankomstinstruktioner.",
    "Inde i boksen: lejlighedsnøgle.",
    "Luk boksen efter du har taget nøglen, og brug den ikke som opbevaring under opholdet.",
    "",
    "%%IMG_KEY_BOX%%",
    "",
    "Den trinvise guide med fotos findes i Chill Concierge App.",
    "",
    "### Udtjekning & bagage",
    "",
    "Udtjekning: senest kl. 11.00.",
    "Sørg for at forlade lejligheden senest kl. 11.00.",
    "Vi er fuldt booket de fleste dage, og nye gæster ankommer tidligt, så sen udtjekning er desværre ikke mulig.",
    "",
    "Læg nøglen i den hvide postkasse i gangen i stueetagen, over for elevatoren, på venstre side efter indgang gennem hovedindgangen.",
    "",
    "%%IMG_CHECKOUT_BOX%%",
    "",
    "Du kan stadig bruge bagagerummet efter udtjekning, hvis det er nødvendigt.",
    "De fulde instruktioner med fotos findes ovenfor i Concierge-appen.",
  ].join("\n"),
  pl: [
    "### Zameldowanie i klucze",
    "",
    "Zameldowanie: od 14:00 (wcześniej, jeśli apartament jest gotowy).",
    "Jeśli przyjedziesz przed 11:00, skorzystaj z przechowalni bagażu obok skrytek na klucze. Kod został wysłany w instrukcjach przyjazdu.",
    "",
    "%%IMG_LUGGAGE%%",
    "",
    "Po 11:00:",
    "Jeśli apartament jest już posprzątany, możesz w nim zostać.",
    "Jeśli nie jest jeszcze posprzątany, możesz zostawić w nim bagaż i wrócić później.",
    "",
    "Wejście do budynku od strony parkingu: kod został wysłany w instrukcjach przyjazdu.",
    "",
    "%%IMG_ENTRANCE%%",
    "%%IMG_DIALER%%",
    "",
    "Skrytka na klucze: wewnątrz budynku, po prawej stronie po wejściu głównym wejściem.",
    "Numer skrytki i kod zostały wysłane w instrukcjach przyjazdu.",
    "W środku: klucz do apartamentu.",
    "Po odebraniu klucza zamknij skrytkę i nie używaj jej jako schowka podczas pobytu.",
    "",
    "%%IMG_KEY_BOX%%",
    "",
    "Instrukcja krok po kroku ze zdjęciami jest dostępna w aplikacji Chill Concierge.",
    "",
    "### Wymeldowanie i bagaż",
    "",
    "Wymeldowanie: do 11:00.",
    "Upewnij się, że opuścisz apartament najpóźniej o 11:00.",
    "W większość dni mamy pełne obłożenie, a nowi goście przyjeżdżają wcześnie, dlatego późne wymeldowanie niestety nie jest możliwe.",
    "",
    "Wrzuć klucz do białej skrzynki pocztowej w korytarzu na parterze, naprzeciwko windy, po lewej stronie po wejściu głównym wejściem.",
    "",
    "%%IMG_CHECKOUT_BOX%%",
    "",
    "W razie potrzeby możesz nadal korzystać z przechowalni bagażu po wymeldowaniu.",
    "Pełne instrukcje ze zdjęciami są dostępne powyżej w aplikacji Concierge.",
  ].join("\n"),
};

/** ====== WIFI ====== */
const wifiByRoom = (room) => WIFI.find(w => w.room === room) || null;
const wifiBySsid = (ssid) => WIFI.find(w => w.ssid === ssid) || null;

function buildWifiTroubleshoot(uiLang) {
  return getContentPack(uiLang).wifiTrouble;
}

function buildWifiCreds(entry, uiLang) {
  if (!entry) return null;
  const p = getContentPack(uiLang);
  return `**Wi-Fi:** SSID **${entry.ssid}**, ${p.wifiCredsPass} **${entry.pass}**.`;
}

function injectStayImages(stayRaw) {
  const reps = {
    "%%IMG_ENTRANCE%%": `![](${IMG(P.ENTRANCE)})`,
    "%%IMG_DIALER%%": `![](${IMG(P.DIALER)})`,
    "%%IMG_LUGGAGE%%": `![](${IMG(P.LUGGAGE)})`,
    "%%IMG_KEY_BOX%%": `![](${IMG(P.KEY_BOX)})`,
    "%%IMG_MAIN_ENTRANCE%%": `![](${IMG(P.MAIN_ENTRANCE)})`,
    "%%IMG_CHECKOUT_BOX%%": `![](${IMG(P.CHECKOUT_BOX)})`,
  };
  let s = stayRaw;
  for (const [k, v] of Object.entries(reps)) s = s.split(k).join(v);
  return s;
}

/** ====== QUICK-HELP ====== */
function buildACHelp(uiLang) {
  const p = getContentPack(uiLang);
  return [
    `![](${IMG(P.AC)})`,
    p.ac[0],
    `![](${IMG(P.BALCONY)})`,
    p.ac[1],
    p.ac[2],
  ].join("\n");
}

function buildPowerHelp(uiLang) {
  const p = getContentPack(uiLang);
  return [
    p.power[0],
    `![](${IMG(P.FUSE_IN_APT)})`,
    p.power[1],
    `![](${IMG(P.FUSE_APT)})`,
    p.power[2],
  ].join("\n");
}

function buildAccessibility(uiLang) {
  return getContentPack(uiLang).access;
}

function buildSmoking(uiLang) {
  const p = getContentPack(uiLang);
  return [`![](${IMG(P.BALCONY)})`, p.smoking].join("\n");
}

function buildPets(uiLang) {
  return getContentPack(uiLang).pets;
}

function buildLaundry(uiLang) {
  const p = getContentPack(uiLang);
  return [`![](${IMG(P.LAUNDRY)})`, p.laundry].join("\n");
}

/** ====== ÚSCHOVNA + KLÍČ ====== */
function buildLuggageInfo(uiLang) {
  const p = getContentPack(uiLang);
  const [a, b, c, d] = p.luggage;
  return [
    a,
    `![](${IMG(P.CHECKOUT_BOX)})`,
    b,
    `![](${IMG(P.LUGGAGE)})`,
    c,
    d,
  ].join("\n");
}

/* === Bezpečná verze pro „Náhradní klíč“ – bez jakýchkoli kódů, ale s fotkami === */
function buildKeyHelp(uiLang) {
  const p = getContentPack(uiLang);
  return [`![](${IMG(P.LUGGAGE)})`, `![](${IMG(P.SPARE_KEY)})`, ...p.key].join("\n");
}

/** ====== DALŠÍ INTERNÍ INFO ====== */
function buildTrash(uiLang) {
  const p = getContentPack(uiLang);
  return [`![](${IMG(P.GARBAGE)})`, p.trash].join("\n");
}

function buildDoorbells(uiLang) {
  const p = getContentPack(uiLang);
  return [`![](${IMG(P.DOOR_BELLS)})`, p.doorbells].join("\n");
}

function buildElevatorPhone(uiLang) {
  return getContentPack(uiLang).elevator;
}

function buildFireAlarm(uiLang) {
  return getContentPack(uiLang).fire;
}

function buildLinenTowels(uiLang) {
  return getContentPack(uiLang).linen;
}

function buildDoctor(uiLang) {
  return getContentPack(uiLang).doctor;
}

function buildCoffee(uiLang) {
  return getContentPack(uiLang).coffee;
}

function buildHotWater(uiLang) {
  return getContentPack(uiLang).hotWater;
}

function buildInduction(uiLang) {
  return getContentPack(uiLang).induction;
}

function buildHood(uiLang) {
  return getContentPack(uiLang).hood;
}

function buildSafe(uiLang) {
  return getContentPack(uiLang).safe;
}

function buildStayInstructions(uiLang) {
  const lang = String(uiLang || "").toLowerCase();
  return injectStayImages(STAY_INSTRUCTIONS_BY_LANG[lang] || STAY_INSTRUCTIONS_BY_LANG.en);
}

function buildTransport(uiLang) {
  return getContentPack(uiLang).transport;
}

function buildFoodDelivery(uiLang) {
  return getContentPack(uiLang).foodDelivery;
}

/** ====== VYBAVENÍ HOTELU ====== */
function buildAmenitiesRooms(uiLang) {
  return getContentPack(uiLang).amenitiesRooms;
}

function buildAmenitiesKitchen(uiLang) {
  return getContentPack(uiLang).amenitiesKitchen;
}

function buildAmenitiesBathroom(uiLang) {
  return getContentPack(uiLang).amenitiesBathroom;
}

function buildAmenitiesService(uiLang) {
  const p = getContentPack(uiLang);
  return [
    p.amenitiesServiceTitle,
    buildLaundry(uiLang),
    buildLuggageInfo(uiLang),
    buildTrash(uiLang),
    p.amenitiesServiceExtra,
  ].join("\n\n");
}

/** ====== INTENTY ====== */
function detectLocalSubtype(t) {
  const s = (t || "").toLowerCase();
  if (/(snídan|snidan|breakfast)/i.test(s)) return "breakfast";
  if (/(lékárn|lekárn|lekarn|pharm|pharmacy)/i.test(s)) return "pharmacy";
  if (/(supermarket|potravin|grocery|market)/i.test(s)) return "grocery";
  if (/(kavárn|kavarn|cafe|coffee|káva|kava)/i.test(s)) return "cafe";
  if (/(bakery|pekárn|pekarn|pekárna)/i.test(s)) return "bakery";
  if (/(vegan|vegetari)/i.test(s)) return "veggie";
  if (/(viet|vietnam)/i.test(s)) return "vietnam";
  if (/(česk|cesk|czech cuisine|local food)/i.test(s)) return "czech";
  if (/\b(bar|pub|drink|pivo)\b/i.test(s)) return "bar";
  if (/exchange|směn|smen/i.test(s)) return "exchange";
  if (/\batm\b|bankomat/i.test(s)) return "atm";
  return null;
}

function detectIntent(text) {
  const t = (text || "").toLowerCase();

  if (/\b(wi[-\s]?fi|wifi|internet|heslo|password|ssid)\b/i.test(t)) return "wifi";
  if (/\b(?:a\.?c\.?|ac)\b|klimatizace|klima|air ?conditioning/i.test(t)) return "ac";
  if (/(elektrin|elektrik|electric|electricity|jistič|jistice|proud|svetl|nesviti|no lights|power|fuse|breaker)/i.test(t)) return "power";

  if (/(invalid|wheelchair|bezbar(i|í|í)?er|bez\s?bari|schod|bezbariérov)/i.test(t)) return "access";
  if (/(kouř|kour|kouřit|smok)/i.test(t)) return "smoking";
  if (/\b(pes|psi|dog|mazl(í|i)č|pets?)\b/i.test(t)) return "pets";
  if (/(prádeln|pradel|laund)/i.test(t)) return "laundry";
  if (/(úschovn|uschovn|batožin|batozin|zavazadel|luggage)/i.test(t)) return "luggage";

  if (/\b(náhradn[íy]|spare\s+key)\b/i.test(t)) return "keys";
  if (/(kl[ií]č|klic|key).{0,30}(apartm|pokoj|room)/i.test(t)) return "keys";

  if (/popelnic|odpad|trash|bin/i.test(t)) return "trash";
  if (/(zvonk|bell|doorbell)/i.test(t)) return "doorbells";
  if (/(výtah|vytah|elevator).*(telefon|phone|servis|service|porucha)?/i.test(t)) return "elevator_phone";
  if (/(požár|pozar|fire).*(alarm|hlasič|hlasics)/i.test(t)) return "fire_alarm";
  if (/(povlečen|povleceni|ručník|rucnik|hand ?towel|linen)/i.test(t)) return "linen_towels";
  if (/(doktor|lékař|lekar|doctor|medical|24)/i.test(t)) return "doctor";
  if (/(kávovar|kavovar|tchibo|coffee machine)/i.test(t)) return "coffee";
  if (/(tepl[áa] voda|hot water)/i.test(t)) return "hot_water";
  if (/(indukc|varn[aá] deska|cooktop|hob)/i.test(t)) return "induction";
  if (/(digesto[rř]|odsava[cč]|hood)/i.test(t)) return "hood";
  if (/(trezor|safe)/i.test(t)) return "safe";

  if (/(restaurac|snídan|snidan|breakfast|restaurant|grocer|potravin|pharm|lékárn|lekarn|shop|store|\bbar\b|kavárn|kavarn|vegan|vegetari|czech|cesk|bistro|exchange|směn|smen|\batm\b|bankomat)/i.test(t)) {
    return "local";
  }

  if (/(instrukc|instruction|check[- ]?in|ubytov)/i.test(t)) return "stay_instructions";

  return "general";
}

/** ====== Pomocná logika: je to skutečný follow-up k náhradnímu klíči? ====== */
function isKeysFollowUp(messages = []) {
  const la = (lastAssistant(messages) || "");
  const lu = (lastUser(messages) || "").trim();

  const assistantWasKeys =
    assistantMessageContainsKeyHelp(la) ||
    (la.includes("/help/spare-key.jpg") ||
      la.includes("/help/key-box-wall.jpg") ||
      la.includes("Key-box.jpg"));

  const userIsRoomOnly = /^\s*(00[1]|10[1-5]|20[1-5]|30[1-5])\s*$/.test(lu);

  return assistantWasKeys && userIsRoomOnly;
}

/** ====== MAPS URL BUILDER (preferuje adresu) ====== */
function buildGoogleMapsUrlFromPlace(p = {}) {
  const addr = (p.address || "").trim();
  if (addr) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  }

  const latRaw = p.lat;
  const lonRaw = p.lon;
  const hasLat = latRaw !== null && latRaw !== undefined && String(latRaw).trim() !== "";
  const hasLon = lonRaw !== null && lonRaw !== undefined && String(lonRaw).trim() !== "";

  if (hasLat && hasLon) {
    const lat = parseFloat(latRaw);
    const lon = parseFloat(lonRaw);
    if (Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0)) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    }
  }

  const name = (p.name || "").trim();
  return name ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}` : "https://www.google.com/maps";
}

/** ====== Pomocný sloučený výpis pro „dining“ ====== */
function buildMergedCuratedList(keys = [], {
  max = 12,
  labelOpen = "Otevřít",
  labelMap = "Otevřít mapu"
} = {}) {
  const seen = new Set();
  const items = [];
  keys.forEach(k => {
    (PLACES[k] || []).forEach(p => {
      if (!seen.has(p.name)) {
        seen.add(p.name);
        items.push(p);
      }
    });
  });

  const list = items.slice(0, max);
  if (!list.length) return null;

  return list.map(p => {
    const mapsUrl = buildGoogleMapsUrlFromPlace(p);
    const tags = p.tags?.length ? ` — *${p.tags.join(", ")}*` : "";
    return [
      `- **${p.name}**${tags}`,
      `  - [${labelOpen}](${p.url}) · [${labelMap}](${mapsUrl})`
    ].join("\n");
  }).join("\n\n");
}

/** ====== Lokální výpis s odkazem na mapu pro jednu kategorii ====== */
function buildCuratedListWithMaps(sub, {
  max = 12,
  labelOpen = "Otevřít",
  labelMap = "Otevřít mapu"
} = {}) {
  const src = PLACES[sub] || [];
  const list = src.slice(0, max);
  if (!list.length) return null;

  return list.map(p => {
    const mapsUrl = buildGoogleMapsUrlFromPlace(p);
    const tags = p.tags?.length ? ` — *${p.tags.join(", ")}*` : "";
    return [
      `- **${p.name}**${tags}`,
      `  - [${labelOpen}](${p.url}) · [${labelMap}](${mapsUrl})`
    ].join("\n");
  }).join("\n\n");
}

/** ====== MAIN ====== */
function runConcierge(body) {
  const { messages = [], uiLang = null, control = null } = body || {};
  try {
    const userText = lastUser(messages);

    // 0) Follow-up: číslo pokoje po „Náhradní klíč“ – vrací bezpečný návod (bez kódů)
    if (isKeysFollowUp(messages)) {
      return buildKeyHelp(uiLang);
    }

    // 1) CONTROL – pevná tlačítka
    if (control) {
      // a) Lokální curated seznamy
      if (control.intent === "local") {
        const sub = String(control.sub || "").toLowerCase();
        const labelMap = {
          cs: "Otevřít", en: "Open", de: "Öffnen", fr: "Ouvrir", es: "Abrir",
          ru: "Открыть", uk: "Відкрити", nl: "Openen", it: "Apri", da: "Åbn", pl: "Otwórz"
        };
        const valid = new Set(["dining", "breakfast", "cafe", "bakery", "veggie", "czech", "bar", "vietnam", "grocery", "pharmacy", "exchange", "atm"]);
        if (!valid.has(sub)) {
          return T(uiLang, "handoff");
        }

        let curated;
        if (sub === "dining") {
          curated = buildMergedCuratedList(["breakfast", "czech"], {
            max: 12,
            labelOpen: labelMap[uiLang || "cs"] || "Open",
            labelMap: (uiLang === "cs" ? "Otevřít mapu" :
              uiLang === "de" ? "Karte öffnen" :
                uiLang === "fr" ? "Ouvrir la carte" :
                  uiLang === "es" ? "Abrir mapa" :
                    uiLang === "it" ? "Apri mappa" :
                      uiLang === "pl" ? "Otwórz mapę" :
                        "Open map")
          });
        } else {
          curated = buildCuratedListWithMaps(sub, {
            max: 12,
            labelOpen: labelMap[uiLang || "cs"] || "Open",
            labelMap: (uiLang === "cs" ? "Otevřít mapu" :
              uiLang === "de" ? "Karte öffnen" :
                uiLang === "fr" ? "Ouvrir la carte" :
                  uiLang === "es" ? "Abrir mapa" :
                    uiLang === "it" ? "Apri mappa" :
                      uiLang === "pl" ? "Otwórz mapę" :
                        "Open map")
          });
        }

        // ⏩ list vrať rovnou (bez překladu); fallback přelož
        if (curated) return curated;
        return T(uiLang, "handoff");
      }

      // b) Technické / interní – vracíme markdowny + fotky
      if (control.intent === "tech") {
        const sub = String(control.sub || "").toLowerCase();
        const map = {
          stay_instructions: () => buildStayInstructions(uiLang),
          instructions: () => buildStayInstructions(uiLang),

          wifi: () => buildWifiTroubleshoot(uiLang),
          power: () => buildPowerHelp(uiLang),
          ac: () => buildACHelp(uiLang),
          hot_water: () => buildHotWater(uiLang),
          induction: () => buildInduction(uiLang),
          hood: () => buildHood(uiLang),
          coffee: () => buildCoffee(uiLang),
          fire_alarm: () => buildFireAlarm(uiLang),
          elevator_phone: () => buildElevatorPhone(uiLang),
          luggage: () => buildLuggageInfo(uiLang),
          keys: () => buildKeyHelp(uiLang),
          doorbells: () => buildDoorbells(uiLang),
          trash: () => buildTrash(uiLang),
          laundry: () => buildLaundry(uiLang),
          access: () => buildAccessibility(uiLang),
          smoking: () => buildSmoking(uiLang),
          pets: () => buildPets(uiLang),
          linen_towels: () => buildLinenTowels(uiLang),
          doctor: () => buildDoctor(uiLang),
          safe: () => buildSafe(uiLang),
          transport: () => buildTransport(uiLang),
          food_delivery: () => buildFoodDelivery(uiLang),
        };
        const fn = map[sub];
        const text = fn ? fn() : T(uiLang, "handoff");
        return text;
      }

      // c) Vybavení hotelu
      if (control.intent === "amenities") {
        const sub = String(control.sub || "").toLowerCase();
        const map = {
          rooms: () => buildAmenitiesRooms(uiLang),
          kitchen: () => buildAmenitiesKitchen(uiLang),
          bathroom: () => buildAmenitiesBathroom(uiLang),
          service: () => buildAmenitiesService(uiLang),
        };
        const fn = map[sub];
        const text = fn ? fn() : T(uiLang, "handoff");
        return text;
      }

      // d) NOVÉ: Instrukce k ubytování
      if (control.intent === "stay" && String(control.sub || "").toLowerCase() === "instructions") {
        return buildStayInstructions(uiLang);
      }
    }

    // 2) Handoff (parkování apod.)
    if (FORBIDDEN_PATTERNS.some(r => r.test(userText))) {
      return T(uiLang, "handoff");
    }

    // 3) Intent z volného textu
    const intent = detectIntent(userText);
    const wifiContext = historyContainsWifi(messages);

    if (intent === "wifi" || (wifiContext && (extractRoom(userText) || extractSSID(userText)))) {
      const room = extractRoom(userText);
      const ssid = extractSSID(userText);
      const entry = room ? wifiByRoom(room) : (ssid ? wifiBySsid(ssid) : null);

      if (entry) return buildWifiCreds(entry, uiLang);
      const reply = recentlySentWifiTroubleshoot(messages)
        ? T(uiLang, "wifiAsk")
        : buildWifiTroubleshoot(uiLang);
      return reply;
    }

    if (intent === "stay_instructions") return buildStayInstructions(uiLang);
    if (intent === "ac") return buildACHelp(uiLang);
    if (intent === "power") return buildPowerHelp(uiLang);
    if (intent === "access") return buildAccessibility(uiLang);
    if (intent === "smoking") return buildSmoking(uiLang);
    if (intent === "pets") return buildPets(uiLang);
    if (intent === "laundry") return buildLaundry(uiLang);
    if (intent === "luggage") return buildLuggageInfo(uiLang);
    if (intent === "keys") return buildKeyHelp(uiLang);
    if (intent === "trash") return buildTrash(uiLang);
    if (intent === "doorbells") return buildDoorbells(uiLang);
    if (intent === "elevator_phone") return buildElevatorPhone(uiLang);
    if (intent === "fire_alarm") return buildFireAlarm(uiLang);
    if (intent === "linen_towels") return buildLinenTowels(uiLang);
    if (intent === "doctor") return buildDoctor(uiLang);
    if (intent === "coffee") return buildCoffee(uiLang);
    if (intent === "hot_water") return buildHotWater(uiLang);
    if (intent === "induction") return buildInduction(uiLang);
    if (intent === "hood") return buildHood(uiLang);
    if (intent === "safe") return buildSafe(uiLang);

    if (intent === "local") {
      let sub = detectLocalSubtype(userText);
      if (!sub) return T(uiLang, "handoff");
      const labelMap = {
        cs: "Otevřít", en: "Open", de: "Öffnen", fr: "Ouvrir", es: "Abrir",
        ru: "Открыть", uk: "Відкрити", nl: "Openen", it: "Apri", da: "Åbn", pl: "Otwórz"
      };
      const curated = buildCuratedListWithMaps(sub, {
        max: 12,
        labelOpen: labelMap[uiLang || "cs"] || "Open",
        labelMap: (uiLang === "cs" ? "Otevřít mapu" :
          uiLang === "de" ? "Karte öffnen" :
            uiLang === "fr" ? "Ouvrir la carte" :
              uiLang === "es" ? "Abrir mapa" :
                uiLang === "it" ? "Apri mappa" :
                  uiLang === "pl" ? "Otwórz mapę" :
                    "Open map")
      });

      // ⏩ list vrať rovnou; fallback přelož
      if (curated) return curated;
      return T(uiLang, "handoff");
    }

    // 4) fallback
    return T(uiLang, "ack");

  } catch (e) {
    console.error(e);
    return T(uiLang, "errorGeneric");
  }
}

function parseLambdaBody(event) {
  if (!event?.body) return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  const t = (raw || "").trim();
  if (!t) return {};
  return JSON.parse(t);
}

/** Klasický Netlify / AWS tvar — spolehlivější než výchozí export s Request (502 na některých projektech). */
export const handler = async (event, context) => {
  const method =
    event.httpMethod ||
    event.requestContext?.http?.method ||
    event.requestContext?.method ||
    "";
  if (method !== "POST") {
    return {
      statusCode: 405,
      headers: { "content-type": "text/plain; charset=utf-8" },
      body: "Method Not Allowed",
    };
  }
  let body;
  try {
    body = parseLambdaBody(event);
  } catch (e) {
    console.error(e);
    return {
      statusCode: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ reply: T(body?.uiLang, "errorInvalidJson") }),
    };
  }
  try {
    const reply = runConcierge(body);
    const text = typeof reply === "string" ? reply : String(reply ?? "");
    return {
      statusCode: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ reply: text }),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        reply: T(body?.uiLang, "errorGeneric"),
      }),
    };
  }
};
