/**
 * Dlouhé instrukce pro concierge podle jazyka UI.
 * cs = čeština; všechny ostatní kódy z aplikace dostanou angličtinu (dokud nepřidáme další jazyky).
 */

export function getContentPack(uiLang) {
  return String(uiLang || "").toLowerCase() === "cs" ? CS : EN;
}

/** Detekce „už jsme poslali Wi-Fi troubleshooting“ (čeština + angličtina). */
export function assistantSentWifiTroubleshoot(text) {
  const t = text || "";
  return /Pokud Wi-?Fi nefunguje:/i.test(t) || /If Wi-?Fi isn['']t working:/i.test(t);
}

const CS = {
  wifiTrouble: [
    "Pokud Wi-Fi nefunguje:",
    "1) Zkontrolujte kabely u routeru.",
    "2) Restartujte: vytáhněte napájecí kabel na 10 s, poté zapojte a vyčkejte 1–2 minuty.",
    "3) Pokud to nepomůže, napište, jakou **jinou Wi-Fi** vidíte – pošlu k ní heslo.",
    "👉 Pokud znáte **číslo apartmánu** nebo **SSID** (4 znaky), napište mi ho a pošlu heslo.",
  ].join("\n"),
  wifiCredsPass: "heslo",

  ac: [
    "U klimatizace zkontrolujte režim: ☀️ = topení, ❄️ = chlazení.",
    "Pokud **zelená kontrolka bliká**, je potřeba restart: na **2. patře** na balkoně jsou **AC vypínače**. Vypněte svůj na ~30 s a pak zapněte.",
    "To obvykle problém vyřeší.",
  ],
  power: [
    "Pokud vypadne elektřina v apartmánu:",
    "Nejdříve **zkontrolujte jističe v apartmánu** (malá bílá dvířka ve zdi).",
    "Může to být **hlavní jistič apartmánu** u balkonu – pokud je **dole**, zvedněte ho nahoru.",
  ],
  access: [
    "Do budovy vedou **dva schody**. Do apartmánu **001** je **jeden schod**.",
    "Jinak bez schodů a s **velkým výtahem**.",
    "Ve sprchách je cca **30 cm** vysoký okraj vaničky.",
  ].join("\n"),
  smoking: [
    "Pro kouření využijte prosím **společné balkony** na každém patře naproti výtahu.",
    "⚠️ **Neodklepávejte a nevyhazujte** nedopalky z balkonu – používejte popelník.",
  ].join("\n"),
  pets:
    "Domácí mazlíčci / psi jsou **vítáni a zdarma**. Prosíme, aby **nelezli na postele a gauče**.",
  laundry:
    "Prádelna je v **suterénu**, otevřena **non-stop** a **zdarma**. K dispozici jsou prostředky i **žehlička** (lze vzít na pokoj).",

  luggage: [
    "**Check-out je do 11:00** (přijíždějí noví hosté).",
    "Nejprve prosím **vhoďte klíče do check-out boxu**.",
    "Potom můžete **po 11:00** uložit zavazadla v **úschovně batožiny** – je v průjezdu **vedle schránky na klíče**.",
    "**Kód na číselníku u vchodu do průchodu je 3142#.** Po uložení prosím **zkontrolujte, že jsou dveře zavřené**.",
  ],

  key: [
    "Zapomenutý klíč:",
    "1) V budově je k dispozici **úschovna s boxy na náhradní klíče**.",
    "2) Pro vydání kódu se ověřuje host a číslo apartmánu.",
    "**Pro kód od náhradního klíče kontaktujte Davida (WhatsApp +420 733 439 733).**",
  ],

  trash: [
    "🗑️ **Popelnice** jsou **venku na dvoře**.",
    "Až vyndáte **plný pytel** z vašeho odpadkového koše, **nový pytel** najdete **pod ním**.",
  ].join("\n"),
  doorbells: [
    "🔔 **Zvonky na apartmány**: můžete zazvonit vašim blízkým domovními zvonky.",
    "Jsou **na začátku průchodu z ulice**.",
  ].join("\n"),
  elevator:
    "🛗 **Výtah – servis/porucha**: zavolejte **00420 775 784 446** (uveďte Sokolská 64, Praha 2).",
  fire: [
    "🔥 **Požární hlásič**:",
    "Pokud **nehoří** (jen se připálilo jídlo), na **přízemí za výtahem** je **dlouhá tyč**.",
    "Tou **zamáčkněte tlačítko uprostřed hlásiče** a vyvětrejte.",
  ].join("\n"),
  linen: [
    "🧺 **Povlečení / ručníky**:",
    "Potřebujete-li **čisté prostěradlo/povlečení/ručník/toaletní papír**, na **každém patře** je **skříň**.",
    "Otevřete ji kódem **526** a vezměte jen potřebné množství.",
  ].join("\n"),
  doctor:
    "👩‍⚕️ **Lékař 24/7**: **+420 603 433 833**, **+420 603 481 361**. Uveďte adresu a apartmán.",
  coffee: [
    "☕ **Kávovar Tchibo**:",
    "– Nejčastěji je **plná nádoba na sedliny** → vyprázdnit.",
    "– Pokud nepomůže, **očistěte senzor nádoby** (uvnitř nad nádobou). Stačí prstem lehce očistit.",
  ].join("\n"),
  hotWater:
    "💧 **Nejde teplá voda**: prosím **počkejte až 20 minut**, než se v bojleru ohřeje nová. Pokud ani potom neteče, napište mi čas a apartmán.",
  induction: [
    "🍳 **Indukce**:",
    "– „**L**“ = dětská pojistka → podržte **Child Lock** (vedle Zap/Vyp) pár sekund, až zmizí.",
    "– „**F**“ = použijte **indukční nádobí** (magnetické dno, dostatečný průměr).",
  ].join("\n"),
  hood: "🔆 **Digestoř**: vysuňte ji dopředu; **tlačítka jsou vpravo** po vysunutí.",
  safe: [
    "🔐 **Trezor**:",
    "– Je-li zamčený a nevíte kód, kontaktujte prosím **Davida** (WhatsApp +420 733 439 733).",
    "– Pro nastavení: uvnitř dveří stiskněte **červené tlačítko**, zadejte kód (≥3 číslice), stiskněte **tlačítko zámku**, zavřete dveře.",
  ].join("\n"),

  /** Značky %%IMG_*%% nahradí concierge.js markdownem obrázků (pořadí = původní návod). */
  stayRaw: [
    "## Instrukce k ubytování",
    "",
    "### Check-in & klíče",
    "%%IMG_ENTRANCE%%",
    "**Check-in:** od **14:00** (dříve, pokud je apartmán připraven).",
    "Pokud přijedete **před 11:00**, využijte prosím **úschovnu zavazadel** vedle schránek na klíče. Kód **3142#**.",
    "%%IMG_LUGGAGE%%",
    "",
    "**Po 11:00:**",
    "- Pokud je apartmán už uklizený, můžete zůstat přímo uvnitř.",
    "- Pokud ještě uklizený není, můžete si v něm nechat zavazadla a vrátit se později.",
    "",
    "**Schránka na klíče:** bílá schránka v průchodu do dvora.",
    "Číslo schránky a kód vám **pošle / poslal David**.",
    "Uvnitř: **klíč** a **čip** (vchodové dveře přes senzor).",
    "Po vyzvednutí prosím schránku **zavřete** a **nepoužívejte** ji během pobytu jako úložiště.",
    "%%IMG_KEY_BOX%%",
    "%%IMG_MAIN_ENTRANCE%%",
    "",
    "### Check-out & zavazadla",
    "**Check-out:** do **11:00**.",
    "Prosím, opusťte apartmán **nejpozději do 11:00**.",
    "Hotel má plnou obsazenost a noví hosté obvykle **přijíždějí** brzy po poledni, takže bohužel **není možné** nabídnout pozdní odjezd (late check-out).",
    "",
    "Klíč prosím vhoďte do **bílé poštovní schránky** v přízemí, **naproti výtahu** (uvnitř budovy).",
    "%%IMG_CHECKOUT_BOX%%",
    "**Úschovnu zavazadel** můžete využít i po check-outu.",
  ].join("\n"),

  transport: [
    "🗺️ **Doprava po Praze**",
    "– Většinu míst zvládnete **pěšky**. Na **Staroměstské náměstí ~15 min**, na **Pražský hrad ~1 hod** pěšky.",
    "– **Hlavní nádraží** je asi **10 min** chůzí.",
    "– **Jízdenku** koupíte **bezkontaktní kartou** přímo **u prostředních dveří** tramvaje.",
    "– Na **Pražský hrad** jede **tram 22** z **I. P. Pavlova** (cca **100 m** od nás).",
  ].join("\n"),

  foodDelivery: [
    "🛵 **Jídlo domů**",
    "Můžete si objednat přímo na apartmán přes **Foodora** nebo **Wolt**.",
    "- [Foodora](https://www.foodora.cz/)\n- [Wolt](https://wolt.com/)",
  ].join("\n"),

  amenitiesRooms: [
    "## Vybavení hotelu — Pokoje",
    "- Postele jsou **povlečené**",
    "- **Různé velikosti polštářů**",
    "- **Televize**",
    "- **Gauč**",
    "- **Klimatizace**",
    "- **Vyhřívání klimatizací**",
    "- **Skříně**",
    "- **Ztmavovací závěsy**",
  ].join("\n"),

  amenitiesKitchen: [
    "## Vybavení hotelu — Kuchyň",
    "- **Nádobí**",
    "- **Kávovar**",
    "- **Káva**",
    "- **Příbory**",
    "- **Mikrovlnka**",
    "- **Lednice**",
    "- **Indukční deska**",
    "- **Trouba**",
    "- **Tablety do myčky**",
    "- **Myčka**",
  ].join("\n"),

  amenitiesBathroom: [
    "## Vybavení hotelu — Koupelna",
    "- **Koupelna**",
    "- **Záchod**",
    "- **Toaletní papír**",
    "- **Mýdlo**",
    "- **Pleťový krém**",
    "- **Sprchový gel**",
    "- **Šampon**",
    "- **Ručníky**",
    "- **Osušky**",
  ].join("\n"),

  amenitiesServiceTitle: "## Vybavení hotelu — Prádelna, úschovna zavazadel, odpadky",
  amenitiesServiceExtra:
    "- **Náhradní odpadkové pytle**: po vyjmutí plného pytle je **nový pytel pod ním**.",
};

const EN = {
  wifiTrouble: [
    "If Wi-Fi isn't working:",
    "1) Check the cables at the router.",
    "2) Restart: unplug the power cable for 10 seconds, plug it back in, and wait 1–2 minutes.",
    "3) If that doesn't help, tell me which **other Wi-Fi networks** you see — I'll send the password for the right one.",
    "👉 If you know your **apartment number** or **SSID** (4 characters), send it and I'll send the password.",
  ].join("\n"),
  wifiCredsPass: "password",

  ac: [
    "On the AC unit, check the mode: ☀️ = heating, ❄️ = cooling.",
    "If the **green indicator is blinking**, it needs a reset: on the **2nd floor**, on the balcony, there are **AC breakers**. Turn yours off for ~30 s, then back on.",
    "That usually fixes the issue.",
  ],
  power: [
    "If power goes out in the apartment:",
    "First **check the breakers inside the apartment** (small white door in the wall).",
    "It may also be the **apartment's main breaker** by the balcony — if it's **down**, flip it up.",
  ],
  access: [
    "There are **two steps** into the building. Apartment **001** has **one step**.",
    "Otherwise it's step-free with a **large elevator**.",
    "Showers have a shower tray edge about **30 cm** high.",
  ].join("\n"),
  smoking: [
    "Please use the **shared balconies** on each floor opposite the elevator for smoking.",
    "⚠️ **Do not tap out or throw** cigarette butts off the balcony — use an ashtray.",
  ].join("\n"),
  pets:
    "Pets / dogs are **welcome and free of charge**. Please **keep them off beds and sofas**.",
  laundry:
    "The laundry room is in the **basement**, open **24/7** and **free**. Detergent is provided and there's an **iron** (you can take it to your room).",

  luggage: [
    "**Check-out is by 11:00** (new guests are arriving).",
    "Please **drop your keys in the check-out box** first.",
    "After **11:00** you can store luggage in the **luggage room** — it's in the passage **next to the key boxes**.",
    "**The keypad code for the passage entrance is 3142#.** After storing your bags, please **make sure the door is closed**.",
  ],

  key: [
    "Forgotten key:",
    "1) The building has a **luggage room with spare-key boxes**.",
    "2) To get a code, the guest and apartment number are verified.",
    "**For a spare-key code, contact David (WhatsApp +420 733 439 733).**",
  ],

  trash: [
    "🗑️ **Bins** are **outside in the courtyard**.",
    "When you remove a **full bag** from your bin, you'll find a **new bag underneath**.",
  ].join("\n"),
  doorbells: [
    "🔔 **Apartment doorbells**: you can ring your party using the building bells.",
    "They are **at the start of the passage from the street**.",
  ].join("\n"),
  elevator:
    "🛗 **Elevator – service / fault**: call **00420 775 784 446** (say Sokolská 64, Prague 2).",
  fire: [
    "🔥 **Fire alarm**:",
    "If **there is no fire** (e.g. burnt food), on the **ground floor behind the elevator** there is a **long pole**.",
    "Use it to **press the button in the middle of the alarm** and air out the room.",
  ].join("\n"),
  linen: [
    "🧺 **Linen / towels**:",
    "If you need **clean sheets / duvet cover / towels / toilet paper**, there is a **cabinet on each floor**.",
    "Open it with code **526** and take only what you need.",
  ].join("\n"),
  doctor:
    "👩‍⚕️ **Doctor 24/7**: **+420 603 433 833**, **+420 603 481 361**. Give your address and apartment.",
  coffee: [
    "☕ **Tchibo coffee machine**:",
    "– Most often the **grounds container is full** → empty it.",
    "– If that doesn't help, **clean the container sensor** (inside, above the container). A quick wipe with your finger is enough.",
  ].join("\n"),
  hotWater:
    "💧 **No hot water**: please **wait up to 20 minutes** for the boiler to heat fresh water. If it still doesn't run, message me with the time and apartment.",
  induction: [
    "🍳 **Induction hob**:",
    "– “**L**” = child lock → hold **Child Lock** (next to On/Off) for a few seconds until it clears.",
    "– “**F**” = use **induction-compatible cookware** (magnetic base, large enough diameter).",
  ].join("\n"),
  hood: "🔆 **Cooker hood**: pull it forward; the **buttons are on the right** once extended.",
  safe: [
    "🔐 **Safe**:",
    "– If it's locked and you don't know the code, please contact **David** (WhatsApp +420 733 439 733).",
    "– To set a code: inside the door press the **red button**, enter a code (≥3 digits), press the **lock button**, close the door.",
  ].join("\n"),

  stayRaw: [
    "## Check-in instructions",
    "",
    "### Check-in & keys",
    "%%IMG_ENTRANCE%%",
    "**Check-in:** from **14:00** (earlier if the apartment is ready).",
    "If you arrive **before 11:00**, please use the **luggage storage** next to the key boxes. Code **3142#**.",
    "%%IMG_LUGGAGE%%",
    "",
    "**After 11:00:**",
    "- If the apartment is already cleaned, you can stay inside.",
    "- If it's not cleaned yet, you can leave luggage there and come back later.",
    "",
    "**Key box:** white box in the passage to the courtyard.",
    "The box number and code will be **sent / were sent by David**.",
    "Inside: **key** and **fob** (entrance door via sensor).",
    "After pickup please **close the box** and **do not use** it as storage during your stay.",
    "%%IMG_KEY_BOX%%",
    "%%IMG_MAIN_ENTRANCE%%",
    "",
    "### Check-out & luggage",
    "**Check-out:** by **11:00**.",
    "Please leave the apartment **no later than 11:00**.",
    "The hotel is usually fully booked and new guests **arrive** soon after noon, so **late check-out is not available**.",
    "",
    "Please drop the key in the **white mailbox** on the **ground floor** **opposite the elevator** (inside the building).",
    "%%IMG_CHECKOUT_BOX%%",
    "You can also use the **luggage room** after check-out.",
  ].join("\n"),

  transport: [
    "🗺️ **Getting around Prague**",
    "– Most places are easy **on foot**. **Old Town Square ~15 min**, **Prague Castle ~1 hour** walking.",
    "– **Main train station** is about **10 minutes** on foot.",
    "– Buy a **ticket** with a **contactless card** at the **middle doors** of the tram.",
    "– **Tram 22** to **Prague Castle** from **I. P. Pavlova** (~**100 m** from us).",
  ].join("\n"),

  foodDelivery: [
    "🛵 **Food delivery**",
    "You can order straight to the apartment via **Foodora** or **Wolt**.",
    "- [Foodora](https://www.foodora.cz/)\n- [Wolt](https://wolt.com/)",
  ].join("\n"),

  amenitiesRooms: [
    "## Hotel amenities — Rooms",
    "- Beds are **made** with linen",
    "- **Different pillow sizes**",
    "- **TV**",
    "- **Sofa**",
    "- **Air conditioning**",
    "- **Heating via the AC units**",
    "- **Wardrobes**",
    "- **Blackout curtains**",
  ].join("\n"),

  amenitiesKitchen: [
    "## Hotel amenities — Kitchen",
    "- **Cookware**",
    "- **Coffee machine**",
    "- **Coffee**",
    "- **Cutlery**",
    "- **Microwave**",
    "- **Fridge**",
    "- **Induction hob**",
    "- **Oven**",
    "- **Dishwasher tablets**",
    "- **Dishwasher**",
  ].join("\n"),

  amenitiesBathroom: [
    "## Hotel amenities — Bathroom",
    "- **Bathroom**",
    "- **Toilet**",
    "- **Toilet paper**",
    "- **Soap**",
    "- **Face cream**",
    "- **Shower gel**",
    "- **Shampoo**",
    "- **Towels**",
    "- **Bath towels**",
  ].join("\n"),

  amenitiesServiceTitle:
    "## Hotel amenities — Laundry, luggage storage, waste",
  amenitiesServiceExtra:
    "- **Spare bin bags**: after removing a full bag, a **new bag is underneath**.",
};
