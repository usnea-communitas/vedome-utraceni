// fa-i18n.jsx — lightweight localization for 5 languages.
// Czech is the source/fallback. L(cs) returns the translation for the active
// language; Lf(cs, vars) fills {placeholders}. Components keep Czech literals as
// keys and wrap them in L()/Lf().

const FA_LANGS = [
  { code: 'cs', name: 'Čeština' },
  { code: 'en', name: 'English' },
  { code: 'pl', name: 'Polski' },
  { code: 'uk', name: 'Українська' },
  { code: 'es', name: 'Español' },
];

let FA_LANG = 'cs';
function setFaLang(c) { FA_LANG = FA_LANGS.some(l => l.code === c) ? c : 'cs'; }
function getFaLang() { return FA_LANG; }

// dictionary: "czech source" → { en, pl, uk, es }
const S = {
  // ── nav ──
  'Přehled': { en: 'Overview', pl: 'Przegląd', uk: 'Огляд', es: 'Resumen' },
  'Plán': { en: 'Plan', pl: 'Plan', uk: 'План', es: 'Plan' },
  'Cíle': { en: 'Goals', pl: 'Cele', uk: 'Цілі', es: 'Metas' },
  'Tipy': { en: 'Tips', pl: 'Porady', uk: 'Поради', es: 'Consejos' },
  'Reflexe': { en: 'Reflection', pl: 'Refleksja', uk: 'Рефлексія', es: 'Reflexión' },
  'Více': { en: 'More', pl: 'Więcej', uk: 'Більше', es: 'Más' },

  // ── eyebrows / sections ──
  'Měsíční plán': { en: 'Monthly plan', pl: 'Plan miesięczny', uk: 'Місячний план', es: 'Plan mensual' },
  'Rezervy a cíle': { en: 'Reserves & goals', pl: 'Rezerwy i cele', uk: 'Резерви та цілі', es: 'Reservas y metas' },
  'Roční cíle': { en: 'Year goals', pl: 'Cele roczne', uk: 'Річні цілі', es: 'Metas anuales' },
  'Přidat cíl, který chceš sledovat': { en: 'Add a goal to track', pl: 'Dodaj cel do śledzenia', uk: 'Додай ціль для відстеження', es: 'Añade una meta a seguir' },
  'Dovolená': { en: 'Holiday', pl: 'Wakacje', uk: 'Відпустка', es: 'Vacaciones' },
  'Auto': { en: 'Car', pl: 'Samochód', uk: 'Авто', es: 'Coche' },
  'Vzdělání': { en: 'Education', pl: 'Edukacja', uk: 'Освіта', es: 'Educación' },
  'Splněno': { en: 'Done', pl: 'Zrobione', uk: 'Виконано', es: 'Hecho' },
  'Název cíle': { en: 'Goal name', pl: 'Nazwa celu', uk: 'Назва цілі', es: 'Nombre de la meta' },
  'Cílová částka (Kč)': { en: 'Target amount (Kč)', pl: 'Kwota docelowa (Kč)', uk: 'Цільова сума (Kč)', es: 'Importe objetivo (Kč)' },
  'Zrušit': { en: 'Cancel', pl: 'Anuluj', uk: 'Скасувати', es: 'Cancelar' },
  'Uložit': { en: 'Save', pl: 'Zapisz', uk: 'Зберегти', es: 'Guardar' },
  'Laskavé rady': { en: 'Gentle advice', pl: 'Łagodne rady', uk: 'Лагідні поради', es: 'Consejos amables' },
  'Konec měsíce': { en: "Month's end", pl: 'Koniec miesiąca', uk: 'Кінець місяця', es: 'Fin de mes' },
  'Nastavení': { en: 'Settings', pl: 'Ustawienia', uk: 'Налаштування', es: 'Ajustes' },
  'Měsíční rozhodnutí': { en: 'Monthly decisions', pl: 'Miesięczne decyzje', uk: 'Місячні рішення', es: 'Decisiones del mes' },
  'Červen 2026': { en: 'June 2026', pl: 'Czerwiec 2026', uk: 'Червень 2026', es: 'Junio 2026' },

  // ── Přehled ──
  'Celkový měsíční příjem': { en: 'Total monthly income', pl: 'Całkowity miesięczny dochód', uk: 'Загальний місячний дохід', es: 'Ingreso mensual total' },
  'v limitu': { en: 'within limit', pl: 'w limicie', uk: 'у межах', es: 'dentro del límite' },
  'Naplánováno': { en: 'Planned', pl: 'Zaplanowano', uk: 'Заплановано', es: 'Planificado' },
  'Rozděleno': { en: 'Allocated', pl: 'Rozdzielono', uk: 'Розподілено', es: 'Asignado' },
  'Zbývá rozdělit': { en: 'Left to allocate', pl: 'Do rozdzielenia', uk: 'Залишилось розподілити', es: 'Por asignar' },
  'Upravit měsíční plán': { en: 'Edit monthly plan', pl: 'Edytuj plan miesięczny', uk: 'Змінити місячний план', es: 'Editar plan mensual' },
  'Lesní koláč peněz': { en: 'Forest money pie', pl: 'Leśny tort pieniędzy', uk: 'Лісовий пиріг грошей', es: 'Tarta del bosque' },
  'Kouzelný měšec': { en: 'Enchanted money pouch', pl: 'Zaczarowana sakiewka', uk: 'Чарівний гаманець', es: 'Bolsa encantada' },
  'Plán': { en: 'Plan', pl: 'Plan', uk: 'План', es: 'Plan' },
  'naplánováno': { en: 'planned', pl: 'zaplanowano', uk: 'заплановано', es: 'planificado' },
  'Upravit': { en: 'Edit', pl: 'Edytuj', uk: 'Змінити', es: 'Editar' },
  'Detail': { en: 'Detail', pl: 'Szczegóły', uk: 'Деталі', es: 'Detalle' },
  'Investice': { en: 'Investments', pl: 'Inwestycje', uk: 'Інвестиції', es: 'Inversiones' },
  'Mimořádné příjmy': { en: 'Extra income', pl: 'Dodatkowe dochody', uk: 'Додаткові доходи', es: 'Ingresos extra' },
  'Zdroje příjmu': { en: 'Income sources', pl: 'Źródła dochodu', uk: 'Джерела доходу', es: 'Fuentes de ingreso' },
  'ročně': { en: 'per year', pl: 'rocznie', uk: 'на рік', es: 'al año' },
  'Celkem': { en: 'Total', pl: 'Razem', uk: 'Усього', es: 'Total' },
  'Strom cílů': { en: 'Goal tree', pl: 'Drzewo celów', uk: 'Дерево цілей', es: 'Árbol de metas' },
  'Strom přání': { en: 'Wish tree', pl: 'Drzewo życzeń', uk: 'Дерево бажань', es: 'Árbol de deseos' },
  // ── Plán (interactive) ──
  'Celkový příjem': { en: 'Total income', pl: 'Całkowity dochód', uk: 'Загальний дохід', es: 'Ingreso total' },
  'Přidat příjem': { en: 'Add income', pl: 'Dodaj dochód', uk: 'Додати дохід', es: 'Añadir ingreso' },
  'Přidat položku': { en: 'Add item', pl: 'Dodaj pozycję', uk: 'Додати позицію', es: 'Añadir partida' },
  'Název položky': { en: 'Item name', pl: 'Nazwa pozycji', uk: 'Назва позиції', es: 'Nombre de la partida' },
  'Částka (Kč)': { en: 'Amount (Kč)', pl: 'Kwota (Kč)', uk: 'Сума (Kč)', es: 'Importe (Kč)' },
  'Opakuje se měsíčně': { en: 'Repeats monthly', pl: 'Powtarza się co miesiąc', uk: 'Повторюється щомісяця', es: 'Se repite cada mes' },
  'Návrhy': { en: 'Suggestions', pl: 'Propozycje', uk: 'Пропозиції', es: 'Sugerencias' },
  'Co rozdělit': { en: 'What to split', pl: 'Co podzielić', uk: 'Що розподілити', es: 'Qué repartir' },
  'cíl': { en: 'target', pl: 'cel', uk: 'ціль', es: 'meta' },
  // category deep explanations (Tipy)
  'Tři kategorie, tři role': { en: 'Three categories, three roles', pl: 'Trzy kategorie, trzy role', uk: 'Три категорії, три ролі', es: 'Tres categorías, tres papeles' },
  'Pevný základ života. Patří sem nájem, energie, jídlo, doprava — výdaje, které se opakují a drží tě v bezpečí. Cíl 50 % příjmu je zdravá hranice: když je nutné výrazně vyšší, je čas hledat, kde uvolnit tlak.':
    { en: 'The solid base of life: rent, utilities, food, transport — recurring costs that keep you safe. A 50% target is a healthy line; if needs run much higher, it\u2019s time to find where to ease the pressure.',
      pl: 'Solidna podstawa życia: czynsz, media, jedzenie, transport — powtarzalne koszty, które dają poczucie bezpieczeństwa. Cel 50% to zdrowa granica; jeśli potrzeby są znacznie wyższe, czas poszukać ulgi.',
      uk: 'Міцна основа життя: оренда, комуналка, їжа, транспорт — регулярні витрати, що тримають тебе в безпеці. Ціль 50% — здорова межа; якщо потрібне значно більше, час шукати, де послабити тиск.',
      es: 'La base sólida de la vida: alquiler, servicios, comida, transporte — gastos recurrentes que te dan seguridad. Un objetivo del 50% es una línea sana; si lo esencial sube mucho, toca aliviar la presión.' },
  'Tvoje budoucí svoboda. Spoření, rezerva a investice, které dnes odkládáš pro sebe zítra. I 20 % dělá s časem a složeným úročením zázraky — důležitější než kolik je, že to děláš pravidelně.':
    { en: 'Your future freedom: savings, a reserve and investments you set aside today for tomorrow\u2019s you. Even 20% works wonders over time with compounding — consistency matters more than the amount.',
      pl: 'Twoja przyszła wolność: oszczędności, rezerwa i inwestycje, które dziś odkładasz dla siebie z jutra. Nawet 20% z czasem i procentem składanym czyni cuda — ważniejsza jest regularność niż kwota.',
      uk: 'Твоя майбутня свобода: заощадження, резерв та інвестиції, які ти сьогодні відкладаєш для себе завтрашнього. Навіть 20% з часом і складним відсотком творять дива — регулярність важливіша за суму.',
      es: 'Tu libertad futura: ahorro, una reserva e inversiones que apartas hoy para tu yo de mañana. Incluso un 20% hace maravillas con el tiempo y el interés compuesto — la constancia importa más que la cantidad.' },
  'Tvoje dnešní radost. Kavárny, výlety, koníčky a drobnosti, co ti dělají život hezčí. Plánovat radost naschvál je dovednost — utrácení bez viny tě udrží u rozpočtu mnohem déle než odříkání.':
    { en: 'Your joy today: cafés, trips, hobbies and little things that make life nicer. Planning joy on purpose is a skill — guilt-free spending keeps you on budget far longer than self-denial.',
      pl: 'Twoja dzisiejsza radość: kawiarnie, wycieczki, hobby i drobiazgi, które umilają życie. Świadome planowanie przyjemności to umiejętność — wydawanie bez poczucia winy utrzyma cię w budżecie dłużej niż wyrzeczenia.',
      uk: 'Твоя сьогоднішня радість: кав\u2019ярні, поїздки, хобі й дрібнички, що роблять життя приємнішим. Свідомо планувати радість — це вміння; витрати без провини втримають тебе в бюджеті значно довше, ніж самозречення.',
      es: 'Tu alegría de hoy: cafés, viajes, aficiones y pequeños gustos que hacen la vida más bonita. Planear la alegría a propósito es una habilidad — gastar sin culpa te mantiene en el presupuesto mucho más que la privación.' },
  'Proč na tom záleží': { en: 'Why it matters', pl: 'Dlaczego to ważne', uk: 'Чому це важливо', es: 'Por qué importa' },
  'z příjmu': { en: 'of income', pl: 'dochodu', uk: 'доходу', es: 'del ingreso' },
  // category descriptions (short)
  'Nájem, energie a jídlo — základ, bez kterého se neobejdeš.': { en: 'Rent, utilities and food — the basics you can\u2019t do without.', pl: 'Czynsz, media i jedzenie — podstawy, bez których się nie obejdziesz.', uk: 'Оренда, комунальні та їжа — основа, без якої не обійтися.', es: 'Alquiler, servicios y comida — lo básico imprescindible.' },
  'Spoření a investice, které pěstuješ pro sebe.': { en: 'Savings and investments you grow for yourself.', pl: 'Oszczędności i inwestycje, które pielęgnujesz dla siebie.', uk: 'Заощадження та інвестиції, які ти плекаєш для себе.', es: 'Ahorros e inversiones que cultivas para ti.' },
  'Kavárny, výlety a drobnosti, co tě těší.': { en: 'Cafés, trips and little things that bring you joy.', pl: 'Kawiarnie, wycieczki i drobiazgi, które cię cieszą.', uk: 'Кав\u2019ярні, поїздки й дрібнички, що тебе тішать.', es: 'Cafés, viajes y pequeños gustos que te alegran.' },
  // suggested item names
  'Nájem': { en: 'Rent', pl: 'Czynsz', uk: 'Оренда', es: 'Alquiler' },
  'Energie': { en: 'Utilities', pl: 'Media', uk: 'Комуналка', es: 'Servicios' },
  'Jídlo': { en: 'Food', pl: 'Jedzenie', uk: 'Їжа', es: 'Comida' },
  'Doprava': { en: 'Transport', pl: 'Transport', uk: 'Транспорт', es: 'Transporte' },
  'Telefon a internet': { en: 'Phone & internet', pl: 'Telefon i internet', uk: 'Телефон та інтернет', es: 'Teléfono e internet' },
  'Spoření': { en: 'Savings', pl: 'Oszczędności', uk: 'Заощадження', es: 'Ahorro' },
  'Investice': { en: 'Investing', pl: 'Inwestycje', uk: 'Інвестиції', es: 'Inversión' },
  'Rezerva': { en: 'Reserve', pl: 'Rezerwa', uk: 'Резерв', es: 'Reserva' },
  'Kavárna': { en: 'Café', pl: 'Kawiarnia', uk: 'Кав\u2019ярня', es: 'Café' },
  'Výlety': { en: 'Trips', pl: 'Wycieczki', uk: 'Поїздки', es: 'Viajes' },
  'Předplatné': { en: 'Subscriptions', pl: 'Subskrypcje', uk: 'Підписки', es: 'Suscripciones' },
  'Dárky': { en: 'Gifts', pl: 'Prezenty', uk: 'Подарунки', es: 'Regalos' },
  'Hlavní práce': { en: 'Main job', pl: 'Główna praca', uk: 'Основна робота', es: 'Trabajo principal' },
  'Coaching': { en: 'Coaching', pl: 'Coaching', uk: 'Коучинг', es: 'Coaching' },
  'Podpora': { en: 'Benefits', pl: 'Zasiłek', uk: 'Допомога', es: 'Subsidio' },
  'Drobné brigády': { en: 'Side gigs', pl: 'Dorywcze prace', uk: 'Підробітки', es: 'Trabajillos' },

  // ── categories ──
  'Nutné': { en: 'Need', pl: 'Niezbędne', uk: 'Необхідне', es: 'Esenciales' },
  'Potřebné': { en: 'Need', pl: 'Niezbędne', uk: 'Необхідне', es: 'Esenciales' },
  'Budoucí já': { en: 'Future me', pl: 'Przyszły ja', uk: 'Майбутній я', es: 'Mi yo futuro' },
  'Radost': { en: 'Fun', pl: 'Radość', uk: 'Радість', es: 'Alegría' },
  'Řešit': { en: 'Review', pl: 'Do uwagi', uk: 'Увага', es: 'Revisar' },
  'OK': { en: 'OK', pl: 'OK', uk: 'OK', es: 'OK' },

  // ── status notes (templates) ──
  'Překročeno o {v}.': { en: 'Over by {v}.', pl: 'Przekroczono o {v}.', uk: 'Перевищено на {v}.', es: 'Excedido en {v}.' },
  'Pod cílem o {v}.': { en: 'Under target by {v}.', pl: 'Poniżej celu o {v}.', uk: 'Нижче цілі на {v}.', es: 'Por debajo de la meta en {v}.' },
  'V rámci cíle.': { en: 'Within target.', pl: 'W ramach celu.', uk: 'У межах цілі.', es: 'Dentro de la meta.' },

  // ── templates: Přehled/Plán ──
  'Cíl {p} % · {v}': { en: 'Target {p} % · {v}', pl: 'Cel {p} % · {v}', uk: 'Ціль {p} % · {v}', es: 'Meta {p} % · {v}' },
  '{p} % z příjmu': { en: '{p} % of income', pl: '{p} % dochodu', uk: '{p} % доходу', es: '{p} % del ingreso' },
  '{v} z příjmu · cíl {p} %': { en: '{v} of income · target {p} %', pl: '{v} dochodu · cel {p} %', uk: '{v} доходу · ціль {p} %', es: '{v} del ingreso · meta {p} %' },
  'Ještě zbývá rozdělit {v}.': { en: '{v} still to allocate.', pl: 'Do rozdzielenia jeszcze {v}.', uk: 'Ще залишилось розподілити {v}.', es: 'Aún quedan {v} por asignar.' },
  'Zbývá splnit {v}': { en: '{v} to go', pl: 'Pozostało {v}', uk: 'Залишилось {v}', es: 'Faltan {v}' },

  // ── Plán ──
  'Měsíční příjem': { en: 'Monthly income', pl: 'Dochód miesięczny', uk: 'Місячний дохід', es: 'Ingreso mensual' },
  'Příjem': { en: 'Income', pl: 'Dochód', uk: 'Дохід', es: 'Ingreso' },
  'Volné': { en: 'Free', pl: 'Wolne', uk: 'Вільне', es: 'Libre' },
  'Rozděl podle 50 / 30 / 20': { en: 'Split by 50 / 30 / 20', pl: 'Podziel wg 50 / 30 / 20', uk: 'Розподіли за 50 / 30 / 20', es: 'Divide en 50 / 30 / 20' },
  'Uložit plán': { en: 'Save plan', pl: 'Zapisz plan', uk: 'Зберегти план', es: 'Guardar plan' },
  'Vše rozděleno — krásně vyvážené.': { en: 'All allocated — beautifully balanced.', pl: 'Wszystko rozdzielone — pięknie zrównoważone.', uk: 'Усе розподілено — чудово збалансовано.', es: 'Todo asignado — bellamente equilibrado.' },
  'Překročeno o {v}': { en: 'Over by {v}', pl: 'Przekroczono o {v}', uk: 'Перевищено на {v}', es: 'Excedido en {v}' },
  'Nad cílem o {v}': { en: 'Over target by {v}', pl: 'Powyżej celu o {v}', uk: 'Вище цілі на {v}', es: 'Sobre la meta en {v}' },
  'Pod cílem o {v}': { en: 'Under target by {v}', pl: 'Poniżej celu o {v}', uk: 'Нижче цілі на {v}', es: 'Bajo la meta en {v}' },
  'V rámci cíle': { en: 'Within target', pl: 'W ramach celu', uk: 'У межах цілі', es: 'Dentro de la meta' },

  // ── Cíle ──
  'z cíle {v}': { en: 'of {v} goal', pl: 'z celu {v}', uk: 'з цілі {v}', es: 'de la meta {v}' },
  'z cíle {a} · zbývá {b}': { en: 'of {a} · {b} to go', pl: 'z {a} · pozostało {b}', uk: 'з {a} · залишилось {b}', es: 'de {a} · faltan {b}' },
  'Aktivní cíle': { en: 'Active goals', pl: 'Aktywne cele', uk: 'Активні цілі', es: 'Metas activas' },
  'Investováno': { en: 'Invested', pl: 'Zainwestowano', uk: 'Інвестовано', es: 'Invertido' },
  'Zbývá splnit': { en: 'To go', pl: 'Pozostało', uk: 'Залишилось', es: 'Faltan' },
  'Tvé malé trezory': { en: 'Your little vaults', pl: 'Twoje małe skarbce', uk: 'Твої маленькі сейфи', es: 'Tus pequeñas bóvedas' },
  'Tvůj malý les': { en: 'Your little forest', pl: 'Twój mały las', uk: 'Твій маленький ліс', es: 'Tu pequeño bosque' },
  'Přidat cíl': { en: 'Add goal', pl: 'Dodaj cel', uk: 'Додати ціль', es: 'Añadir meta' },
  'Vedlejší zdroje a jednorázové příjmy.': { en: 'Side sources and one-off income.', pl: 'Dodatkowe źródła i jednorazowe dochody.', uk: 'Додаткові джерела та разові доходи.', es: 'Fuentes adicionales e ingresos puntuales.' },
  '{a} z {b}': { en: '{a} of {b}', pl: '{a} z {b}', uk: '{a} з {b}', es: '{a} de {b}' },
  'zbývá {v}': { en: '{v} left', pl: 'pozostało {v}', uk: 'залишилось {v}', es: 'faltan {v}' },

  // ── goal names ──
  'Nouzová rezerva': { en: 'Emergency fund', pl: 'Fundusz awaryjny', uk: 'Резервний фонд', es: 'Fondo de emergencia' },
  'Investice · ETF': { en: 'Investments · ETF', pl: 'Inwestycje · ETF', uk: 'Інвестиції · ETF', es: 'Inversiones · ETF' },
  'Dovolená · Toskánsko': { en: 'Holiday · Tuscany', pl: 'Wakacje · Toskania', uk: 'Відпустка · Тоскана', es: 'Vacaciones · Toscana' },
  'Nový notebook': { en: 'New laptop', pl: 'Nowy laptop', uk: 'Новий ноутбук', es: 'Portátil nuevo' },

  // ── Tipy ──
  'Malé návyky, které dělají velký klid. Klepni na kartu a otoč ji — čeká tě malá zajímavost.':
    { en: 'Small habits that bring great calm. Tap a card and flip it — a little fact awaits.',
      pl: 'Małe nawyki, które dają wielki spokój. Dotknij karty i obróć ją — czeka cię ciekawostka.',
      uk: 'Маленькі звички, що дарують великий спокій. Торкнись картки й переверни — на тебе чекає цікавинка.',
      es: 'Pequeños hábitos que dan gran calma. Toca una tarjeta y gírala — te espera una curiosidad.' },
  'Otoč pro zajímavost': { en: 'Flip for a fact', pl: 'Obróć po ciekawostkę', uk: 'Переверни для цікавинки', es: 'Gira para un dato' },
  'Zpět na tip': { en: 'Back to tip', pl: 'Wróć do porady', uk: 'Назад до поради', es: 'Volver al consejo' },
  'Pravidlo 24 hodin': { en: 'The 24-hour rule', pl: 'Zasada 24 godzin', uk: 'Правило 24 годин', es: 'La regla de 24 horas' },
  'U věcí nad 1\u00a0000 Kč počkej den. Touha často sama opadne.':
    { en: 'For things over 1,000 Kč, wait a day. The urge often fades on its own.',
      pl: 'Przy rzeczach powyżej 1000 Kč poczekaj dzień. Pragnienie często samo mija.',
      uk: 'Для речей дорожче 1000 Kč зачекай день. Бажання часто згасає саме.',
      es: 'Para cosas de más de 1000 Kč, espera un día. El impulso suele desaparecer.' },
  'Zaplať nejdřív budoucí já': { en: 'Pay your future self first', pl: 'Najpierw zapłać przyszłemu sobie', uk: 'Спершу заплати майбутньому собі', es: 'Págate primero a tu yo futuro' },
  'Hned po výplatě odlož 20\u00a0% stranou, než se peníze „rozkutálí".':
    { en: 'Right after payday, set aside 20% before the money "rolls away".',
      pl: 'Zaraz po wypłacie odłóż 20% na bok, zanim pieniądze się „rozejdą".',
      uk: 'Одразу після зарплати відклади 20%, поки гроші не «розкотилися».',
      es: 'Justo tras cobrar, aparta el 20% antes de que el dinero "se escurra".' },
  'Radost není luxus': { en: 'Joy is not a luxury', pl: 'Radość to nie luksus', uk: 'Радість — не розкіш', es: 'La alegría no es un lujo' },
  'Drobné potěšení plánuj naschvál — vina jen kazí požitek.':
    { en: 'Plan small pleasures on purpose — guilt only spoils the joy.',
      pl: 'Małe przyjemności planuj celowo — poczucie winy psuje radość.',
      uk: 'Маленькі радощі плануй навмисно — провина лише псує задоволення.',
      es: 'Planea pequeños placeres a propósito — la culpa solo arruina el gusto.' },
  'Pojmenuj své cíle': { en: 'Name your goals', pl: 'Nazwij swoje cele', uk: 'Назви свої цілі', es: 'Nombra tus metas' },
  'Spoření s názvem („Toskánsko") přežije pokušení líp než „rezerva".':
    { en: 'Savings with a name ("Tuscany") beat temptation better than "reserve".',
      pl: 'Oszczędności z nazwą („Toskania") opierają się pokusie lepiej niż „rezerwa".',
      uk: 'Заощадження з назвою («Тоскана») долають спокусу краще, ніж «резерв».',
      es: 'Un ahorro con nombre ("Toscana") resiste la tentación mejor que "reserva".' },
  'Věděla jsi?': { en: 'Did you know?', pl: 'Czy wiesz?', uk: 'Чи знала ти?', es: '¿Sabías que?' },
  'Odložený nákup zruší skoro každý druhý člověk. Po dni „spaní" už novou věc mozek tolik nechce.':
    { en: 'Almost every other person cancels a postponed purchase. After a night, the brain wants it far less.',
      pl: 'Prawie co druga osoba rezygnuje z odłożonego zakupu. Po przespanej nocy mózg już go tak nie chce.',
      uk: 'Майже кожен другий скасовує відкладену покупку. Після ночі мозок хоче її значно менше.',
      es: 'Casi una de cada dos personas cancela una compra aplazada. Tras dormirlo, el cerebro la desea mucho menos.' },
  'Malé číslo, velký les': { en: 'Small number, big forest', pl: 'Mała liczba, wielki las', uk: 'Мале число, великий ліс', es: 'Número pequeño, gran bosque' },
  '500 Kč měsíčně při 6\u00a0% výnosu je za 30 let přes půl milionu. Složený úrok je tichá zahradnice.':
    { en: '500 Kč a month at 6% is over half a million in 30 years. Compound interest is a quiet gardener.',
      pl: '500 Kč miesięcznie przy 6% to ponad pół miliona po 30 latach. Procent składany to cichy ogrodnik.',
      uk: '500 Kč на місяць під 6% — це понад пів мільйона за 30 років. Складний відсоток — тихий садівник.',
      es: '500 Kč al mes al 6% son más de medio millón en 30 años. El interés compuesto es un jardinero silencioso.' },
  'Zážitky > věci': { en: 'Experiences > things', pl: 'Przeżycia > rzeczy', uk: 'Враження > речі', es: 'Experiencias > cosas' },
  'Výzkumy štěstí říkají: peníze za zážitky těší déle než za věci. Vzpomínka neztratí lesk.':
    { en: 'Happiness research says: money spent on experiences delights longer than on things. A memory keeps its shine.',
      pl: 'Badania szczęścia mówią: pieniądze na przeżycia cieszą dłużej niż na rzeczy. Wspomnienie nie traci blasku.',
      uk: 'Дослідження щастя кажуть: гроші на враження тішать довше, ніж на речі. Спогад не втрачає блиску.',
      es: 'La ciencia de la felicidad dice: el dinero en experiencias alegra más que en cosas. Un recuerdo no pierde su brillo.' },
  'Síla jména': { en: 'The power of a name', pl: 'Siła nazwy', uk: 'Сила імені', es: 'El poder de un nombre' },
  'Pojmenovaný cíl máš výrazně větší šanci dotáhnout — mozek ho pak brání jako svůj.':
    { en: 'A named goal is far likelier to be reached — the brain then defends it as its own.',
      pl: 'Nazwany cel masz znacznie większą szansę osiągnąć — mózg broni go jak własnego.',
      uk: 'Названу ціль значно більше шансів досягти — мозок боронить її як свою.',
      es: 'Una meta con nombre tiene mucha más probabilidad de lograrse — el cerebro la defiende como suya.' },

  // ── InvestSim ──
  'Síla složeného úročení': { en: 'The power of compounding', pl: 'Siła procentu składanego', uk: 'Сила складного відсотка', es: 'El poder del interés compuesto' },
  'Kouzlo složeného úročení': { en: 'The magic of compounding', pl: 'Magia procentu składanego', uk: 'Магія складного відсотка', es: 'La magia del interés compuesto' },
  'Za {y} let by sis naspořila': { en: 'In {y} years you would save', pl: 'Przez {y} lat zaoszczędzisz', uk: 'За {y} років ти заощадиш', es: 'En {y} años ahorrarías' },
  'z toho výnos +\u00a0{v}\u00a0Kč': { en: 'of which gains +\u00a0{v}\u00a0Kč', pl: 'w tym zysk +\u00a0{v}\u00a0Kč', uk: 'з них дохід +\u00a0{v}\u00a0Kč', es: 'de ello ganancia +\u00a0{v}\u00a0Kč' },
  'dnes': { en: 'today', pl: 'dziś', uk: 'сьогодні', es: 'hoy' },
  'za {y} let': { en: 'in {y} years', pl: 'za {y} lat', uk: 'за {y} років', es: 'en {y} años' },
  'Vklady': { en: 'Contributions', pl: 'Wpłaty', uk: 'Внески', es: 'Aportes' },
  'Výnos (úroky)': { en: 'Gains (interest)', pl: 'Zysk (odsetki)', uk: 'Дохід (відсотки)', es: 'Ganancia (interés)' },
  'Měsíčně vkládám': { en: 'I invest monthly', pl: 'Wpłacam miesięcznie', uk: 'Вкладаю щомісяця', es: 'Invierto al mes' },
  'Po dobu': { en: 'For', pl: 'Przez', uk: 'Протягом', es: 'Durante' },
  '{y} let': { en: '{y} years', pl: '{y} lat', uk: '{y} років', es: '{y} años' },
  'Očekávaný roční výnos': { en: 'Expected annual return', pl: 'Oczekiwany roczny zwrot', uk: 'Очікувана річна дохідність', es: 'Rendimiento anual esperado' },
  'Opatrný': { en: 'Cautious', pl: 'Ostrożny', uk: 'Обережний', es: 'Cauto' },
  'Průměr': { en: 'Average', pl: 'Średni', uk: 'Середній', es: 'Promedio' },
  'Odvážný': { en: 'Bold', pl: 'Odważny', uk: 'Сміливий', es: 'Audaz' },
  'Složené úročení znamená, že výnosy samy vydělávají další výnosy. Index S&P\u00a0500 historicky vynesl s reinvesticí dividend zhruba 7–10\u00a0% ročně. Graf je zjednodušená ilustrace — minulé výnosy nezaručují budoucí a nejde o investiční doporučení.':
    { en: 'Compounding means returns earn further returns. The S&P\u00a0500 has historically returned roughly 7–10% a year with dividends reinvested. The chart is a simplified illustration — past returns don\u2019t guarantee future ones and this is not investment advice.',
      pl: 'Procent składany oznacza, że zyski same zarabiają kolejne zyski. Indeks S&P\u00a0500 historycznie dawał ok. 7–10% rocznie przy reinwestycji dywidend. Wykres to uproszczona ilustracja — przeszłe wyniki nie gwarantują przyszłych i nie jest to porada inwestycyjna.',
      uk: 'Складний відсоток означає, що дохід сам заробляє новий дохід. Індекс S&P\u00a0500 історично давав близько 7–10% на рік із реінвестуванням дивідендів. Графік — спрощена ілюстрація: минулі результати не гарантують майбутніх і це не інвестиційна порада.',
      es: 'El interés compuesto significa que las ganancias generan más ganancias. El S&P\u00a0500 ha rendido históricamente un 7–10% anual reinvirtiendo dividendos. El gráfico es una ilustración simplificada — rendimientos pasados no garantizan futuros y esto no es asesoramiento de inversión.' },

  // ── Reflexe ──
  'Jak ti bylo s penězi?': { en: 'How did money feel?', pl: 'Jak było ci z pieniędzmi?', uk: 'Як тобі було з грошима?', es: '¿Cómo te fue con el dinero?' },
  'Stísněně': { en: 'Tense', pl: 'Z napięciem', uk: 'Напружено', es: 'Tenso' },
  'V rovnováze': { en: 'Balanced', pl: 'W równowadze', uk: 'У рівновазі', es: 'En equilibrio' },
  'S radostí': { en: 'Joyful', pl: 'Z radością', uk: 'З радістю', es: 'Con alegría' },
  'Otázky měsíce': { en: 'Questions of the month', pl: 'Pytania miesiąca', uk: 'Питання місяця', es: 'Preguntas del mes' },
  'Napiš pár vět jen pro sebe…': { en: 'Write a few lines just for yourself…', pl: 'Napisz kilka zdań tylko dla siebie…', uk: 'Напиши кілька рядків лише для себе…', es: 'Escribe unas líneas solo para ti…' },
  'Co mi tento měsíc udělalo radost — a stálo to méně, než bych čekala?':
    { en: 'What brought me joy this month — and cost less than I expected?',
      pl: 'Co sprawiło mi radość w tym miesiącu — a kosztowało mniej, niż myślałam?',
      uk: 'Що цього місяця принесло мені радість — і коштувало менше, ніж я очікувала?',
      es: '¿Qué me dio alegría este mes — y costó menos de lo que esperaba?' },
  'Který výdaj se mi teď zdá zbytečný — a co bych za ty peníze raději měla?':
    { en: 'Which expense now seems pointless — and what would I rather have for that money?',
      pl: 'Który wydatek wydaje mi się teraz zbędny — i co wolałabym za te pieniądze?',
      uk: 'Яка витрата тепер здається зайвою — і що б я радше мала за ці гроші?',
      es: '¿Qué gasto me parece ahora innecesario — y qué preferiría por ese dinero?' },
  'Co dobrého jsem udělala pro své „budoucí já"?':
    { en: 'What good did I do for my "future self"?',
      pl: 'Co dobrego zrobiłam dla swojego „przyszłego ja"?',
      uk: 'Що доброго я зробила для свого «майбутнього я»?',
      es: '¿Qué hice de bueno por mi "yo futuro"?' },

  // ── Více ──
  'Účet': { en: 'Account', pl: 'Konto', uk: 'Обліковий запис', es: 'Cuenta' },
  'Osobní profil': { en: 'Personal profile', pl: 'Profil osobisty', uk: 'Особистий профіль', es: 'Perfil personal' },
  'Zabezpečení': { en: 'Security', pl: 'Bezpieczeństwo', uk: 'Безпека', es: 'Seguridad' },
  'Pravidlo 50 / 30 / 20': { en: '50 / 30 / 20 rule', pl: 'Zasada 50 / 30 / 20', uk: 'Правило 50 / 30 / 20', es: 'Regla 50 / 30 / 20' },
  'Upravit poměry': { en: 'Edit ratios', pl: 'Edytuj proporcje', uk: 'Змінити пропорції', es: 'Editar proporciones' },
  'Jemné připomínky': { en: 'Gentle reminders', pl: 'Łagodne przypomnienia', uk: 'Делікатні нагадування', es: 'Recordatorios suaves' },
  'Zapnuto': { en: 'On', pl: 'Włączone', uk: 'Увімкнено', es: 'Activado' },
  'Vzhled': { en: 'Appearance', pl: 'Wygląd', uk: 'Вигляд', es: 'Apariencia' },
  'Jazyk': { en: 'Language', pl: 'Język', uk: 'Мова', es: 'Idioma' },
  'Lesní klid': { en: 'Forest Calm', pl: 'Leśny spokój', uk: 'Лісовий спокій', es: 'Calma del bosque' },
  'Kouzelnický': { en: 'Wizardly', pl: 'Czarodziejski', uk: 'Чарівний', es: 'Mágico' },
  'verze 1.0': { en: 'version 1.0', pl: 'wersja 1.0', uk: 'версія 1.0', es: 'versión 1.0' },
};

function L(cs) {
  if (FA_LANG === 'cs') return cs;
  const e = S[cs];
  return (e && e[FA_LANG]) || cs;
}
function Lf(cs, vars) {
  let s = L(cs);
  for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}

Object.assign(window, { FA_LANGS, setFaLang, getFaLang, L, Lf });
