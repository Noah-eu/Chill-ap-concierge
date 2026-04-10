// src/flows.js

export const LANGS = {
  cs: "Čeština",
  en: "English",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
};

const L = {
  cs: {
    root: "Vyberte téma",
    back: "← Zpět",
    footerHelp: "Pokud jste nenašli informace, které potřebujete, obraťte se na Davida – WhatsApp +420 733 439 733.",
    // groups
    tech: "Technické potíže",
    house: "Domovní informace",
    local: "Doporučení v okolí",
    pets: "Domácí mazlíčci",
    // tech items
    wifi:        { label: "Wi-Fi",            prompt: "mám problém s wifi" },
    power:       { label: "Elektřina",       prompt: "mám problém s elektřinou v apartmánu" },
    hot_water:   { label: "Teplá voda",      prompt: "nejde teplá voda" },
    ac:          { label: "Klimatizace",     prompt: "klimatizace nefunguje" },
    induction:   { label: "Indukční deska",  prompt: "indukce ukazuje L nebo F" },
    hood:        { label: "Digestoř",        prompt: "jak zapnout digestoř" },
    coffee:      { label: "Kávovar Tchibo",  prompt: "kávovar tchibo nefunguje" },
    fire_alarm:  { label: "Požární hlásič",  prompt: "požární hlásič pípá" },
    safe:        { label: "Trezor",          prompt: "trezor – nastavení kódu / odemknout" },
    elevator:    { label: "Výtah – servis",  prompt: "potřebuji číslo na servis výtahu" },
    // house items
    luggage:     { label: "Úschovna batožiny & check-out", prompt: "kde je úschovna batožiny po 11:00 a jak na check-out" },
    spare_key:   { label: "Náhradní klíč",   prompt: "zapomenutý klíč – potřebuji náhradní klíč" },
    laundry:     { label: "Prádelna",        prompt: "kde je prádelna" },
    smoking:     { label: "Kouření / balkony", prompt: "kde se kouří na balkonech" },
    access:      { label: "Bezbariérovost",  prompt: "je budova bezbariérová" },
    trash:       { label: "Odpadky / popelnice", prompt: "kde jsou popelnice a pytle" },
    doorbells:   { label: "Zvonky na apartmány", prompt: "kde jsou domovní zvonky" },
    linen:       { label: "Povlečení / ručníky", prompt: "kde je skříň s povlečením a ručníky" },
    doctor:      { label: "Doktor 24/7",     prompt: "kontakt na lékaře 24 hodin" },
    // local items
    breakfast:   { label: "Snídaně",         prompt: "doporuč snídaňová místa v okruhu 200 m" },
    cafe:        { label: "Kavárna / pekárna", prompt: "doporuč kavárny a pekárny do 200 m" },
    veggie:      { label: "Vegan/vegetarián", prompt: "doporuč vegan nebo vegetarián do 200 m" },
    czech:       { label: "Česká kuchyně",   prompt: "doporuč českou kuchyni do 200 m" },
    vietnam:     { label: "Vietnamské bistro", prompt: "doporuč vietnamské bistro do 200 m" },
    grocery:     { label: "Supermarket",     prompt: "kde je supermarket do 200 m" },
    pharmacy:    { label: "Lékárna",         prompt: "kde je nejbližší lékárna do 200 m" },
    exchange:    { label: "Směnárna",        prompt: "kde je směnárna do 200 m" },
    atm:         { label: "ATM",             prompt: "kde je nejbližší bankomat" },
    petsInfo:    "Chtěl bych info o domácích mazlíčcích",
  },

  en: {
    root: "Pick a topic",
    back: "← Back",
    footerHelp: "If you can’t find what you need, message David – WhatsApp +420 733 439 733.",
    tech: "Technical issues",
    house: "House info",
    local: "Nearby tips",
    pets: "Pets",
    wifi:        { label: "Wi-Fi",            prompt: "I have a problem with the Wi-Fi" },
    power:       { label: "Electricity",      prompt: "I have a problem with electricity in my apartment" },
    hot_water:   { label: "Hot water",        prompt: "Hot water is not working" },
    ac:          { label: "Air conditioning", prompt: "The AC is not working" },
    induction:   { label: "Induction hob",    prompt: "Induction shows L or F" },
    hood:        { label: "Extractor hood",   prompt: "How to turn on the kitchen hood" },
    coffee:      { label: "Tchibo coffee",    prompt: "Tchibo coffee machine not working" },
    fire_alarm:  { label: "Fire alarm",       prompt: "Fire alarm beeps" },
    safe:        { label: "Safe",             prompt: "Safe – set code / unlock" },
    elevator:    { label: "Elevator service", prompt: "I need the elevator service phone number" },
    luggage:     { label: "Luggage room & check-out", prompt: "Where is the luggage room after 11:00 and how to check out" },
    spare_key:   { label: "Spare key",        prompt: "I forgot my key – need a spare key" },
    laundry:     { label: "Laundry",          prompt: "Where is the laundry room" },
    smoking:     { label: "Smoking / balconies", prompt: "Where can I smoke on the balconies" },
    access:      { label: "Accessibility",    prompt: "Is the building accessible" },
    trash:       { label: "Trash / bins",     prompt: "Where are the trash bins and spare bags" },
    doorbells:   { label: "Apartment doorbells", prompt: "Where are the apartment doorbells" },
    linen:       { label: "Linen / towels",   prompt: "Where is the linen/towels cabinet" },
    doctor:      { label: "Doctor 24/7",      prompt: "Doctor contact – 24/7 service" },
    breakfast:   { label: "Breakfast",        prompt: "Recommend breakfast places within 200 m" },
    cafe:        { label: "Cafe / bakery",    prompt: "Recommend cafes and bakeries within 200 m" },
    veggie:      { label: "Vegan/vegetarian", prompt: "Recommend vegan or vegetarian within 200 m" },
    czech:       { label: "Czech food",       prompt: "Recommend Czech food within 200 m" },
    vietnam:     { label: "Vietnamese bistro", prompt: "Recommend Vietnamese bistro within 200 m" },
    grocery:     { label: "Supermarket",      prompt: "Where is a supermarket within 200 m" },
    pharmacy:    { label: "Pharmacy",         prompt: "Where is the nearest pharmacy within 200 m" },
    exchange:    { label: "Exchange",         prompt: "Where is a currency exchange within 200 m" },
    atm:         { label: "ATM",              prompt: "Where is the nearest ATM" },
    petsInfo:    "I want info about pets",
  },

  // (kratší lokalizace – štítky stačí; prompty mohou klidně zůstat EN/CZ, backend stejně překládá)
  es: {
    root: "Elige un tema", back: "← Atrás", footerHelp: "Si no encuentras la información, escribe a David – WhatsApp +420 733 439 733.",
    tech: "Problemas técnicos", house: "Información de la casa", local: "Recomendaciones cercanas", pets: "Mascotas",
    wifi:{label:"Wi-Fi",prompt:"I have a problem with the Wi-Fi"}, power:{label:"Electricidad",prompt:"I have a problem with electricity in my apartment"},
    hot_water:{label:"Agua caliente",prompt:"Hot water is not working"}, ac:{label:"Aire acondicionado",prompt:"The AC is not working"},
    induction:{label:"Placa de inducción",prompt:"Induction shows L or F"}, hood:{label:"Campana extractora",prompt:"How to turn on the kitchen hood"},
    coffee:{label:"Cafetera Tchibo",prompt:"Tchibo coffee machine not working"}, fire_alarm:{label:"Alarma de incendio",prompt:"Fire alarm beeps"},
    safe:{label:"Caja fuerte",prompt:"Safe – set code / unlock"}, elevator:{label:"Ascensor – servicio",prompt:"I need the elevator service phone number"},
    luggage:{label:"Consigna & check-out",prompt:"Where is the luggage room after 11:00 and how to check out"}, spare_key:{label:"Llave de repuesto",prompt:"I forgot my key – need a spare key"},
    laundry:{label:"Lavandería",prompt:"Where is the laundry room"}, smoking:{label:"Fumar / balcones",prompt:"Where can I smoke on the balconies"},
    access:{label:"Accesibilidad",prompt:"Is the building accessible"}, trash:{label:"Basura / contenedores",prompt:"Where are the trash bins and spare bags"},
    doorbells:{label:"Timbres",prompt:"Where are the apartment doorbells"},
    linen:{label:"Ropa de cama / toallas",prompt:"Where is the linen/towels cabinet"}, doctor:{label:"Médico 24/7",prompt:"Doctor contact – 24/7 service"},
    breakfast:{label:"Desayuno",prompt:"Recommend breakfast places within 200 m"}, cafe:{label:"Cafetería / panadería",prompt:"Recommend cafes and bakeries within 200 m"},
    veggie:{label:"Vegano/vegetariano",prompt:"Recommend vegan or vegetarian within 200 m"}, czech:{label:"Cocina checa",prompt:"Recommend Czech food within 200 m"},
    vietnam:{label:"Bistró vietnamita",prompt:"Recommend Vietnamese bistro within 200 m"}, grocery:{label:"Supermercado",prompt:"Where is a supermarket within 200 m"},
    pharmacy:{label:"Farmacia",prompt:"Where is the nearest pharmacy within 200 m"}, exchange:{label:"Cambio de moneda",prompt:"Where is a currency exchange within 200 m"},
    atm:{label:"Cajero (ATM)",prompt:"Where is the nearest ATM"}, petsInfo:"Quiero información sobre mascotas",
  },

  de: {
    root:"Thema wählen", back:"← Zurück", footerHelp:"Falls Sie etwas nicht finden, schreiben Sie David – WhatsApp +420 733 439 733.",
    tech:"Technische Probleme", house:"Hausinfos", local:"Tipps in der Nähe", pets:"Haustiere",
    wifi:{label:"Wi-Fi",prompt:"I have a problem with the Wi-Fi"}, power:{label:"Strom",prompt:"I have a problem with electricity in my apartment"},
    hot_water:{label:"Warmwasser",prompt:"Hot water is not working"}, ac:{label:"Klimaanlage",prompt:"The AC is not working"},
    induction:{label:"Induktionskochfeld",prompt:"Induction shows L or F"}, hood:{label:"Dunstabzug",prompt:"How to turn on the kitchen hood"},
    coffee:{label:"Tchibo-Kaffee",prompt:"Tchibo coffee machine not working"}, fire_alarm:{label:"Feuermelder",prompt:"Fire alarm beeps"},
    safe:{label:"Safe",prompt:"Safe – set code / unlock"}, elevator:{label:"Aufzug – Service",prompt:"I need the elevator service phone number"},
    luggage:{label:"Gepäckraum & Check-out",prompt:"Where is the luggage room after 11:00 and how to check out"}, spare_key:{label:"Ersatzschlüssel",prompt:"I forgot my key – need a spare key"},
    laundry:{label:"Waschküche",prompt:"Where is the laundry room"}, smoking:{label:"Rauchen / Balkone",prompt:"Where can I smoke on the balconies"},
    access:{label:"Barrierefreiheit",prompt:"Is the building accessible"}, trash:{label:"Müll / Tonnen",prompt:"Where are the trash bins and spare bags"},
    doorbells:{label:"Klingeln",prompt:"Where are the apartment doorbells"},
    linen:{label:"Bettwäsche / Handtücher",prompt:"Where is the linen/towels cabinet"}, doctor:{label:"Arzt 24/7",prompt:"Doctor contact – 24/7 service"},
    breakfast:{label:"Frühstück",prompt:"Recommend breakfast places within 200 m"}, cafe:{label:"Café / Bäckerei",prompt:"Recommend cafes and bakeries within 200 m"},
    veggie:{label:"Vegan/vegetarisch",prompt:"Recommend vegan or vegetarian within 200 m"}, czech:{label:"Tschechische Küche",prompt:"Recommend Czech food within 200 m"},
    vietnam:{label:"Vietnamesisches Bistro",prompt:"Recommend Vietnamese bistro within 200 m"}, grocery:{label:"Supermarkt",prompt:"Where is a supermarket within 200 m"},
    pharmacy:{label:"Apotheke",prompt:"Where is the nearest pharmacy within 200 m"}, exchange:{label:"Wechselstube",prompt:"Where is a currency exchange within 200 m"},
    atm:{label:"Geldautomat",prompt:"Where is the nearest ATM"}, petsInfo:"Ich möchte Infos zu Haustieren",
  },

  fr: {
    root:"Choisissez un sujet", back:"← Retour", footerHelp:"Si vous ne trouvez pas l’info, contactez David – WhatsApp +420 733 439 733.",
    tech:"Problèmes techniques", house:"Infos de la maison", local:"Adresses à proximité", pets:"Animaux",
    wifi:{label:"Wi-Fi",prompt:"I have a problem with the Wi-Fi"}, power:{label:"Électricité",prompt:"I have a problem with electricity in my apartment"},
    hot_water:{label:"Eau chaude",prompt:"Hot water is not working"}, ac:{label:"Climatisation",prompt:"The AC is not working"},
    induction:{label:"Plaque à induction",prompt:"Induction shows L or F"}, hood:{label:"Hotte",prompt:"How to turn on the kitchen hood"},
    coffee:{label:"Café Tchibo",prompt:"Tchibo coffee machine not working"}, fire_alarm:{label:"Détecteur de fumée",prompt:"Fire alarm beeps"},
    safe:{label:"Coffre-fort",prompt:"Safe – set code / unlock"}, elevator:{label:"Ascenseur – service",prompt:"I need the elevator service phone number"},
    luggage:{label:"Consigne & check-out",prompt:"Where is the luggage room after 11:00 and how to check out"}, spare_key:{label:"Clé de secours",prompt:"I forgot my key – need a spare key"},
    laundry:{label:"Buanderie",prompt:"Where is the laundry room"}, smoking:{label:"Fumer / balcons",prompt:"Where can I smoke on the balconies"},
    access:{label:"Accessibilité",prompt:"Is the building accessible"}, trash:{label:"Poubelles / sacs",prompt:"Where are the trash bins and spare bags"},
    doorbells:{label:"Sonnette",prompt:"Where are the apartment doorbells"},
    linen:{label:"Linge / serviettes",prompt:"Where is the linen/towels cabinet"}, doctor:{label:"Médecin 24/7",prompt:"Doctor contact – 24/7 service"},
    breakfast:{label:"Petit-déjeuner",prompt:"Recommend breakfast places within 200 m"}, cafe:{label:"Café / boulangerie",prompt:"Recommend cafes and bakeries within 200 m"},
    veggie:{label:"Vegan/végétarien",prompt:"Recommend vegan or vegetarian within 200 m"}, czech:{label:"Cuisine tchèque",prompt:"Recommend Czech food within 200 m"},
    vietnam:{label:"Bistrot vietnamien",prompt:"Recommend Vietnamese bistro within 200 m"}, grocery:{label:"Supermarché",prompt:"Where is a supermarket within 200 m"},
    pharmacy:{label:"Pharmacie",prompt:"Where is the nearest pharmacy within 200 m"}, exchange:{label:"Bureau de change",prompt:"Where is a currency exchange within 200 m"},
    atm:{label:"Distributeur (ATM)",prompt:"Where is the nearest ATM"}, petsInfo:"Je veux des infos sur les animaux",
  },
};

// Build nodes once per language
export const FLOWS = Object.fromEntries(
  Object.entries(L).map(([code, t]) => {
    const techChildren = [
      t.wifi, t.power, t.hot_water, t.ac, t.induction, t.hood, t.coffee, t.fire_alarm, t.safe, t.elevator
    ];
    const houseChildren = [
      t.luggage, t.spare_key, t.laundry, t.smoking, t.access, t.trash, t.doorbells, t.linen, t.doctor
    ];
    const localChildren = [
      t.breakfast, t.cafe, t.veggie, t.czech, t.vietnam, t.grocery, t.pharmacy, t.exchange, t.atm
    ];
    return [code, [
      { label: t.tech,   children: techChildren },
      { label: t.house,  children: houseChildren },
      { label: t.local,  children: localChildren },
      { label: t.pets,   prompt: "chci informace o domácích mazlíčcích" }, // backend vrátí správný text (povoleni & zdarma)
      { label: t.footerHelp, prompt: "" }, // pouze informativní; nic neodesílá
    ]];
  })
);
