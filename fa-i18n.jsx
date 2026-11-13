// fa-i18n.jsx — lightweight localization for 5 languages.
// Czech literals are the dictionary keys (the app was written in Czech first);
// L(cs) returns the translation for the active language and Lf(cs, vars) fills
// {placeholders}. Components keep the Czech literal and wrap it in L()/Lf().
//
// English is the default UI language. The chosen language is persisted in
// localStorage under 'fa.lang' (included in backups) and restored on load.
// A string missing in the active language falls back to the Czech source.

const FA_LANGS = [
  { code: 'cs', name: 'Čeština' },
  { code: 'en', name: 'English' },
  { code: 'pl', name: 'Polski' },
  { code: 'uk', name: 'Українська' },
  { code: 'es', name: 'Español' },
];
const FA_LANG_DEFAULT = 'en';
const FA_LANG_KEY = 'fa.lang';

function faIsLang(c) { return FA_LANGS.some(l => l.code === c); }

// A link can choose the language: ?lang=cs (or en, pl, uk, es) wins over the stored
// choice and is remembered like one. The parameter is then dropped from the address,
// so after a reload the language switcher stays in charge.
function faLangFromAddress() {
  try {
    const params = new URLSearchParams(location.search);
    if (!params.has('lang')) return null;
    const code = (params.get('lang') || '').slice(0, 2).toLowerCase();
    params.delete('lang');
    const rest = params.toString();
    history.replaceState(history.state, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
    if (!faIsLang(code)) return null;
    saveFaLang(code);
    return code;
  } catch (e) { return null; }
}

// the language from the address, else the stored choice ('fa.lang'), else English
function loadFaLang() {
  const fromAddress = faLangFromAddress();
  if (fromAddress) return fromAddress;
  try {
    const raw = faStorage.get(FA_LANG_KEY);
    const code = raw == null ? null : String(raw).replace(/^"|"$/g, '');
    return faIsLang(code) ? code : FA_LANG_DEFAULT;
  } catch (e) { return FA_LANG_DEFAULT; }
}
function saveFaLang(c) {
  try { if (faIsLang(c)) faStorage.set(FA_LANG_KEY, c); } catch (e) {}
}

let FA_LANG = loadFaLang();
function setFaLang(c) { FA_LANG = faIsLang(c) ? c : FA_LANG_DEFAULT; }
function getFaLang() { return FA_LANG; }
// BCP-47 tag for Intl formatting and <html lang> — the language codes double as locales
function getFaLocale() { return FA_LANG; }

// dictionary: "czech source" → { en, pl, uk, es }
const S = {
  // ── onboarding + real-data mode ──
  'Vítej ve Vědomém utrácení': { en: 'Welcome to Mindful\u00a0Spending', pl: 'Witaj w Świadomym\u00a0wydawaniu', uk: 'Ласкаво просимо до Усвідомлених\u00a0витрат', es: 'Te damos la bienvenida a Gasto\u00a0Consciente' }, // the name stays on one line
  'Žádné odříkání — jen jasný plán: co je potřeba, co tě těší a co posíláš svému budoucímu já.': { en: 'No deprivation — just a clear plan: what you need, what brings you joy, and what you send to your future self.', pl: 'Żadnych wyrzeczeń — tylko jasny plan: co jest potrzebne, co cię cieszy i co wysyłasz swojemu przyszłemu ja.', uk: 'Жодних обмежень — лише чіткий план: що потрібно, що тебе тішить і що ти відкладаєш для майбутнього себе.', es: 'Sin privaciones: solo un plan claro de lo que necesitas, lo que te alegra y lo que envías a tu yo futuro.' },
  'Začít': { en: 'Start', pl: 'Zacznij', uk: 'Почати', es: 'Empezar' },
  'Pokračovat': { en: 'Continue', pl: 'Dalej', uk: 'Далі', es: 'Continuar' },
  'Dokončit': { en: 'Finish', pl: 'Zakończ', uk: 'Завершити', es: 'Terminar' },
  'Jak ti máme říkat?': { en: 'What should we call you?', pl: 'Jak mamy się do ciebie zwracać?', uk: 'Як до тебе звертатися?', es: '¿Cómo te llamamos?' },
  'Jen pro pozdravy uvnitř appky. Klidně přeskoč.': { en: 'Just for greetings inside the app. Feel free to skip.', pl: 'Tylko do powitań w aplikacji. Możesz to pominąć.', uk: 'Лише для привітань у застосунку. Можеш пропустити.', es: 'Solo para saludarte dentro de la app. Puedes saltártelo.' },
  'např. Anička': { en: 'e.g. Annie', pl: 'np. Ania', uk: 'напр., Ганна', es: 'p. ej., Ana' },
  'Tvůj měsíční příjem': { en: 'Your monthly income', pl: 'Twój miesięczny dochód', uk: 'Твій місячний дохід', es: 'Tu ingreso mensual' },
  'Výplata a pravidelné přivýdělky dohromady. Později jde upravit v Plánu.': { en: 'Salary plus regular side income. You can change it later in Plan.', pl: 'Pensja i regularne dodatkowe zarobki razem. Później zmienisz to w Planie.', uk: 'Зарплата й регулярні підробітки разом. Пізніше це можна змінити в Плані.', es: 'Sueldo e ingresos extra habituales juntos. Podrás cambiarlo luego en Plan.' },
  'Rozděl si příjem': { en: 'Split your income', pl: 'Podziel swój dochód', uk: 'Розподіли свій дохід', es: 'Reparte tu ingreso' },
  'Začni rozdělením 50 / 30 / 20 a uprav si ho podle sebe.': { en: 'Start from a 50 / 30 / 20 split and adjust it to fit you.', pl: 'Zacznij od podziału 50 / 30 / 20 i dopasuj go do siebie.', uk: 'Почни з розподілу 50 / 30 / 20 і налаштуй його під себе.', es: 'Empieza con un reparto 50 / 30 / 20 y ajústalo a tu medida.' },
  'Vyvážená 50/30/20': { en: 'Balanced 50/30/20', pl: 'Zrównoważony 50/30/20', uk: 'Збалансований 50/30/20', es: 'Equilibrado 50/30/20' },
  'Úsporné': { en: 'Frugal', pl: 'Oszczędny', uk: 'Ощадливий', es: 'Ahorrador' },
  'Volnější': { en: 'Relaxed', pl: 'Swobodniejszy', uk: 'Вільніший', es: 'Más holgado' },
  'Krásně vyvážené — dohromady 100 %.': { en: 'Beautifully balanced — 100 % total.', pl: 'Pięknie zrównoważone — razem 100 %.', uk: 'Чудово збалансовано — разом 100 %.', es: 'Muy equilibrado: 100 % en total.' },
  'Dohromady {v} % — uprav na 100 %.': { en: '{v} % total — adjust to 100 %.', pl: 'Razem {v} % — dopasuj do 100 %.', uk: 'Разом {v} % — доведи до 100 %.', es: '{v} % en total: ajusta hasta el 100 %.' },
  'Tvůj první cíl': { en: 'Your first goal', pl: 'Twój pierwszy cel', uk: 'Твоя перша ціль', es: 'Tu primera meta' },
  'Vyber, na co šetříš, a sleduj, jak cíl roste — nebo přeskoč a přidej ho později.': { en: 'Pick what you are saving for and watch the goal grow — or skip and add it later.', pl: 'Wybierz, na co oszczędzasz, i patrz, jak cel rośnie — albo pomiń i dodaj go później.', uk: 'Обери, на що відкладаєш, і дивись, як росте ціль, — або пропусти й додай її пізніше.', es: 'Elige para qué ahorras y mira cómo crece tu meta, o sáltalo y añádela después.' },
  'Vlastní cíl': { en: 'Custom goal', pl: 'Własny cel', uk: 'Власна ціль', es: 'Meta propia' },
  '3–6 měsíčních výdajů': { en: '3–6 months of expenses', pl: '3–6 miesięcy wydatków', uk: 'витрати на 3–6 місяців', es: '3–6 meses de gastos' },
  'ETF, fondy, budoucnost': { en: 'ETFs, funds, your future', pl: 'ETF-y, fundusze, przyszłość', uk: 'ETF, фонди, майбутнє', es: 'ETF, fondos, tu futuro' },
  'zážitek, na který se těšíš': { en: 'an experience to look forward to', pl: 'przeżycie, na które czekasz', uk: 'враження, на яке чекаєш', es: 'una experiencia que esperas con ilusión' },
  'cokoliv se jménem': { en: 'anything with a name', pl: 'cokolwiek z nazwą', uk: 'будь-що з назвою', es: 'cualquier cosa con nombre' },
  'Cílová částka': { en: 'Target amount', pl: 'Kwota docelowa', uk: 'Цільова сума', es: 'Importe objetivo' },
  'Vyber si vzhled': { en: 'Choose your look', pl: 'Wybierz wygląd', uk: 'Обери вигляд', es: 'Elige el aspecto' },
  'Kdykoliv jde změnit ve Více → Vzhled.': { en: 'You can change it anytime in More → Appearance.', pl: 'Zmienisz to w każdej chwili w Więcej → Wygląd.', uk: 'Змінити можна будь-коли в Більше → Вигляд.', es: 'Puedes cambiarlo cuando quieras en Más → Apariencia.' },
  'Přeskočit — přidám později': { en: 'Skip — I will add it later', pl: 'Pomiń — dodam później', uk: 'Пропустити — додам пізніше', es: 'Saltar: la añadiré después' },
  'Hlavní příjem': { en: 'Main income', pl: 'Główny dochód', uk: 'Основний дохід', es: 'Ingreso principal' },
  'Zasaď svůj první cíl': { en: 'Plant your first goal', pl: 'Zasadź swój pierwszy cel', uk: 'Посади свою першу ціль', es: 'Planta tu primera meta' },
  'Každý cíl je větev tvého stromu. S každou naspořenou korunou poroste.': { en: 'Every goal is a branch of your tree. It grows with every crown you save.', pl: 'Każdy cel to gałąź twojego drzewa. Rośnie z każdą zaoszczędzoną koroną.', uk: 'Кожна ціль — гілка твого дерева. Вона росте з кожною заощадженою кроною.', es: 'Cada meta es una rama de tu árbol. Crece con cada corona que ahorras.' },
  'Zasaď první cíl a strom začne růst.': { en: 'Plant your first goal and the tree starts growing.', pl: 'Zasadź pierwszy cel, a drzewo zacznie rosnąć.', uk: 'Посади першу ціль — і дерево почне рости.', es: 'Planta tu primera meta y el árbol empezará a crecer.' },
  'Nový cíl': { en: 'New goal', pl: 'Nowy cel', uk: 'Нова ціль', es: 'Nueva meta' },
  'Vložit': { en: 'Deposit', pl: 'Wpłać', uk: 'Внести', es: 'Ingresar' },
  'Částka v Kč': { en: 'Amount in CZK', pl: 'Kwota w Kč', uk: 'Сума в Kč', es: 'Importe en Kč' },
  'Bez jména': { en: 'No name', pl: 'Bez imienia', uk: 'Без імені', es: 'Sin nombre' },
  'Data': { en: 'Data', pl: 'Dane', uk: 'Дані', es: 'Datos' },
  'Smazat všechna data': { en: 'Delete all data', pl: 'Usuń wszystkie dane', uk: 'Видалити всі дані', es: 'Borrar todos los datos' },
  'Opravdu smazat? Nejde vrátit': { en: 'Really delete? Cannot be undone', pl: 'Na pewno usunąć? Nie da się cofnąć', uk: 'Точно видалити? Цього не можна скасувати', es: '¿Seguro que quieres borrarlo? No se puede deshacer' },
  'Nerozděleno': { en: 'Unallocated', pl: 'Nieprzydzielone', uk: 'Нерозподілено', es: 'Sin asignar' },
  'zatím bez plánu': { en: 'no plan yet', pl: 'jeszcze bez planu', uk: 'поки без плану', es: 'aún sin plan' },
  'nad plán': { en: 'over plan', pl: 'ponad plan', uk: 'понад план', es: 'sobre el plan' },
  // ── settings: security / reminders / income ──
  'Vypnuto': { en: 'Off', pl: 'Wyłączone', uk: 'Вимкнено', es: 'Desactivado' },
  'Bez zámku': { en: 'No lock', pl: 'Bez blokady', uk: 'Без замка', es: 'Sin bloqueo' },
  'Aplikace se otevře rovnou': { en: 'The app opens right away', pl: 'Aplikacja otwiera się od razu', uk: 'Застосунок відкривається одразу', es: 'La app se abre directamente' },
  'PIN kód': { en: 'PIN code', pl: 'Kod PIN', uk: 'PIN-код', es: 'Código PIN' },
  '4místný kód při spuštění': { en: '4-digit code at launch', pl: '4-cyfrowy kod przy starcie', uk: '4-значний код при запуску', es: 'Código de 4 dígitos al abrir' },
  'Nastaven · klepni pro změnu': { en: 'Set · tap to change', pl: 'Ustawiony · dotknij, aby zmienić', uk: 'Встановлено · торкніться, щоб змінити', es: 'Configurado · toca para cambiar' },
  'Zadej nový PIN': { en: 'Enter a new PIN', pl: 'Wpisz nowy PIN', uk: 'Введіть новий PIN', es: 'Introduce un PIN nuevo' },
  'Zopakuj PIN': { en: 'Repeat the PIN', pl: 'Powtórz PIN', uk: 'Повторіть PIN', es: 'Repite el PIN' },
  'PINy se neshodují, zkus to znovu': { en: 'PINs don\u2019t match, try again', pl: 'PIN-y się nie zgadzają, spróbuj ponownie', uk: 'PIN-коди не збігаються, спробуйте ще раз', es: 'Los PIN no coinciden, inténtalo de nuevo' },
  'Zadej PIN': { en: 'Enter your PIN', pl: 'Wpisz PIN', uk: 'Введіть PIN', es: 'Introduce tu PIN' },
  'Špatný PIN': { en: 'Wrong PIN', pl: 'Błędny PIN', uk: 'Неправильний PIN', es: 'PIN incorrecto' },
  'Vítej zpět': { en: 'Welcome back', pl: 'Witaj z powrotem', uk: 'З поверненням', es: 'Bienvenida de nuevo' },
  'Vítej zpět, {n}': { en: 'Welcome back, {n}', pl: 'Witaj z powrotem, {n}', uk: 'З поверненням, {n}', es: 'Bienvenida de nuevo, {n}' },
  'Klepni pro odemknutí': { en: 'Tap to unlock', pl: 'Dotknij, aby odblokować', uk: 'Торкніться, щоб розблокувати', es: 'Toca para desbloquear' },
  'Ověřuji…': { en: 'Verifying…', pl: 'Weryfikuję…', uk: 'Перевіряю…', es: 'Verificando…' },
  'Připomínat zápis výdajů': { en: 'Remind me to log spending', pl: 'Przypominaj o zapisywaniu wydatków', uk: 'Нагадувати про запис витрат', es: 'Recuérdame registrar gastos' },
  'Jak často': { en: 'How often', pl: 'Jak często', uk: 'Як часто', es: 'Con qué frecuencia' },
  'Denně': { en: 'Daily', pl: 'Codziennie', uk: 'Щодня', es: 'A diario' },
  'Týdně': { en: 'Weekly', pl: 'Co tydzień', uk: 'Щотижня', es: 'Semanal' },
  'V kolik hodin': { en: 'At what time', pl: 'O której godzinie', uk: 'О котрій годині', es: 'A qué hora' },
  'Ráno': { en: 'Morning', pl: 'Rano', uk: 'Вранці', es: 'Mañana' },
  'Večer': { en: 'Evening', pl: 'Wieczorem', uk: 'Увечері', es: 'Tarde' },
  'Jemné ťuknutí, žádný stres. V hotové aplikaci přijde jako notifikace.': { en: 'A gentle nudge, no stress. In the production app it arrives as a notification.', pl: 'Delikatne przypomnienie, bez stresu. W finalnej aplikacji przyjdzie jako powiadomienie.', uk: 'Лагідне нагадування, без стресу. У готовому застосунку це буде сповіщення.', es: 'Un toque suave, sin estrés. En la app final llegará como notificación.' },
  'Upozornění jsou v prohlížeči zablokovaná — povol je v nastavení.': { en: 'Notifications are blocked in the browser — allow them in settings.', pl: 'Powiadomienia są zablokowane w przeglądarce — włącz je w ustawieniach.', uk: 'Сповіщення заблоковані в браузері — увімкніть їх у налаштуваннях.', es: 'Las notificaciones están bloqueadas en el navegador — permítelas en ajustes.' },
  'Zdroje příjmu přidáš a odebereš v části Plán.': { en: 'Add or remove income sources in the Plan tab.', pl: 'Źródła dochodu dodasz i usuniesz w zakładce Plan.', uk: 'Джерела доходу додавайте та видаляйте у вкладці План.', es: 'Añade o quita fuentes de ingresos en la pestaña Plan.' },
  'Kč/měs': { en: 'Kč/mo', pl: 'Kč/mies.', uk: 'Kč/міс', es: 'Kč/mes' },
  'táhni prstem po grafu': { en: 'drag across the chart', pl: 'przeciągnij po wykresie', uk: 'проведіть пальцем по графіку', es: 'desliza por el gráfico' },


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
  'Leden': { en: 'January', pl: 'Styczeń', uk: 'Січень', es: 'Enero' },
  'Únor': { en: 'February', pl: 'Luty', uk: 'Лютий', es: 'Febrero' },
  'Březen': { en: 'March', pl: 'Marzec', uk: 'Березень', es: 'Marzo' },
  'Duben': { en: 'April', pl: 'Kwiecień', uk: 'Квітень', es: 'Abril' },
  'Květen': { en: 'May', pl: 'Maj', uk: 'Травень', es: 'Mayo' },
  'Červen': { en: 'June', pl: 'Czerwiec', uk: 'Червень', es: 'Junio' },
  'Červenec': { en: 'July', pl: 'Lipiec', uk: 'Липень', es: 'Julio' },
  'Srpen': { en: 'August', pl: 'Sierpień', uk: 'Серпень', es: 'Agosto' },
  'Září': { en: 'September', pl: 'Wrzesień', uk: 'Вересень', es: 'Septiembre' },
  'Říjen': { en: 'October', pl: 'Październik', uk: 'Жовтень', es: 'Octubre' },
  'Listopad': { en: 'November', pl: 'Listopad', uk: 'Листопад', es: 'Noviembre' },
  'Prosinec': { en: 'December', pl: 'Grudzień', uk: 'Грудень', es: 'Diciembre' },

  // ── Přehled ──
  'Celkový měsíční příjem': { en: 'Total monthly income', pl: 'Całkowity miesięczny dochód', uk: 'Загальний місячний дохід', es: 'Ingreso mensual total' },
  'Naplánováno': { en: 'Planned', pl: 'Zaplanowano', uk: 'Заплановано', es: 'Planificado' },
  'Rozděleno': { en: 'Allocated', pl: 'Rozdzielono', uk: 'Розподілено', es: 'Asignado' },
  'Zbývá rozdělit': { en: 'Left to allocate', pl: 'Do rozdzielenia', uk: 'Залишилось розподілити', es: 'Por asignar' },
  'Upravit měsíční plán': { en: 'Edit monthly plan', pl: 'Edytuj plan miesięczny', uk: 'Змінити місячний план', es: 'Editar plan mensual' },
  'Lesní koláč peněz': { en: 'Forest money pie', pl: 'Leśny tort pieniędzy', uk: 'Лісовий пиріг грошей', es: 'Tarta del bosque' },
  'Kouzelný měšec': { en: 'Enchanted money pouch', pl: 'Zaczarowana sakiewka', uk: 'Чарівний гаманець', es: 'Bolsa encantada' },
  'naplánováno': { en: 'planned', pl: 'zaplanowano', uk: 'заплановано', es: 'planificado' },
  'Upravit': { en: 'Edit', pl: 'Edytuj', uk: 'Змінити', es: 'Editar' },
  'Detail': { en: 'Detail', pl: 'Szczegóły', uk: 'Деталі', es: 'Detalle' },
  'Investice': { en: 'Investments', pl: 'Inwestycje', uk: 'Інвестиції', es: 'Inversiones' },
  'Mimořádné příjmy': { en: 'Extra income', pl: 'Dodatkowe dochody', uk: 'Додаткові доходи', es: 'Ingresos extra' },
  'Zdroje příjmu': { en: 'Income sources', pl: 'Źródła dochodu', uk: 'Джерела доходу', es: 'Fuentes de ingreso' },
  'Naspořeno': { en: 'Saved', pl: 'Oszczędzono', uk: 'Заощаджено', es: 'Ahorrado' },
  'ročně': { en: 'per year', pl: 'rocznie', uk: 'на рік', es: 'al año' },
  'Celkem': { en: 'Total', pl: 'Razem', uk: 'Усього', es: 'Total' },
  'Poměry kategorií': { en: 'Category ratios', pl: 'Proporcje kategorii', uk: 'Пропорції категорій', es: 'Proporciones' },
  'Obnovit 50 / 30 / 20': { en: 'Reset to 50 / 30 / 20', pl: 'Przywróć 50 / 30 / 20', uk: 'Скинути до 50 / 30 / 20', es: 'Restablecer 50 / 30 / 20' },
  'Strom cílů': { en: 'Goal tree', pl: 'Drzewo celów', uk: 'Дерево цілей', es: 'Árbol de metas' },
  'Strom přání': { en: 'Wish tree', pl: 'Drzewo życzeń', uk: 'Дерево бажань', es: 'Árbol de deseos' },
  // ── Plán (interactive) ──
  'Celkový příjem': { en: 'Total income', pl: 'Całkowity dochód', uk: 'Загальний дохід', es: 'Ingreso total' },
  'Přidat příjem': { en: 'Add income', pl: 'Dodaj dochód', uk: 'Додати дохід', es: 'Añadir ingreso' },
  'Přidat položku': { en: 'Add item', pl: 'Dodaj pozycję', uk: 'Додати позицію', es: 'Añadir partida' },
  'Název položky': { en: 'Item name', pl: 'Nazwa pozycji', uk: 'Назва позиції', es: 'Nombre de la partida' },
  'Částka (Kč)': { en: 'Amount (Kč)', pl: 'Kwota (Kč)', uk: 'Сума (Kč)', es: 'Importe (Kč)' },
  'Částka – {n}': { en: 'Amount – {n}', pl: 'Kwota – {n}', uk: 'Сума – {n}', es: 'Importe – {n}' },
  'Smazat – {n}': { en: 'Delete – {n}', pl: 'Usuń – {n}', uk: 'Видалити – {n}', es: 'Borrar – {n}' },
  'Snížit – {n}': { en: 'Decrease – {n}', pl: 'Zmniejsz – {n}', uk: 'Зменшити – {n}', es: 'Reducir – {n}' },
  'Zvýšit – {n}': { en: 'Increase – {n}', pl: 'Zwiększ – {n}', uk: 'Збільшити – {n}', es: 'Aumentar – {n}' },
  'Hlavní navigace': { en: 'Main navigation', pl: 'Główna nawigacja', uk: 'Головна навігація', es: 'Navegación principal' },
  // ── backup validation and the error page ──
  'Záloha je poškozená nebo upravená. Data zůstala beze změny.': { en: 'This backup is damaged or was edited. Your data was left unchanged.', pl: 'Ta kopia jest uszkodzona lub zmieniona. Twoje dane pozostały bez zmian.', uk: 'Ця резервна копія пошкоджена або змінена. Твої дані не змінилися.', es: 'Esta copia está dañada o fue modificada. Tus datos no han cambiado.' },
  'Něco se pokazilo': { en: 'Something went wrong', pl: 'Coś poszło nie tak', uk: 'Щось пішло не так', es: 'Algo salió mal' },
  'Aplikace se nedokázala zobrazit, nejspíš kvůli poškozeným datům. Data jsou pořád v tomto prohlížeči. Nejdřív si je ulož do souboru, pak můžeš začít znovu.': { en: 'The app could not be displayed, most likely because of damaged data. Your data is still in this browser. Save it to a file first, then you can start over.', pl: 'Nie udało się wyświetlić aplikacji, najpewniej z powodu uszkodzonych danych. Dane wciąż są w tej przeglądarce. Najpierw zapisz je do pliku, potem możesz zacząć od nowa.', uk: 'Застосунок не вдалося показати, найімовірніше через пошкоджені дані. Дані досі в цьому браузері. Спершу збережи їх у файл, а тоді можеш почати знову.', es: 'No se pudo mostrar la app, probablemente por datos dañados. Tus datos siguen en este navegador. Guárdalos primero en un archivo y después podrás empezar de nuevo.' },
  'Smazat data a začít znovu': { en: 'Delete data and start over', pl: 'Usuń dane i zacznij od nowa', uk: 'Видалити дані й почати знову', es: 'Borrar los datos y empezar de nuevo' },
  'Zkusit znovu': { en: 'Try again', pl: 'Spróbuj ponownie', uk: 'Спробувати знову', es: 'Intentar de nuevo' },
  // ── forgotten PIN ──
  'Nepamatuješ si PIN?': { en: 'Forgot your PIN?', pl: 'Nie pamiętasz PIN-u?', uk: 'Не пам’ятаєш PIN?', es: '¿Olvidaste tu PIN?' },
  'PIN nejde obnovit. Můžeš smazat všechna data v tomto prohlížeči a začít znovu — plán, výdaje, cíle i reflexe zmizí. Pokud máš zálohu, obnovíš ji potom ve Více → Data.': { en: 'The PIN cannot be recovered. You can delete all data in this browser and start over — your plan, expenses, goals and reflections will be gone. If you have a backup file, restore it afterwards in More → Data.', pl: 'Nie da się odzyskać PIN-u. Możesz usunąć wszystkie dane w tej przeglądarce i zacząć od nowa — plan, wydatki, cele i refleksje znikną. Jeśli masz kopię zapasową, przywrócisz ją potem w Więcej → Dane.', uk: 'PIN неможливо відновити. Можеш видалити всі дані в цьому браузері й почати знову — план, витрати, цілі й рефлексії зникнуть. Якщо маєш резервну копію, віднови її потім у Більше → Дані.', es: 'El PIN no se puede recuperar. Puedes borrar todos los datos de este navegador y empezar de nuevo: el plan, los gastos, las metas y las reflexiones desaparecerán. Si tienes una copia de seguridad, restáurala después en Más → Datos.' },
  'Zpět k PINu': { en: 'Back to PIN', pl: 'Wróć do PIN-u', uk: 'Назад до PIN', es: 'Volver al PIN' },
  'Opakuje se měsíčně': { en: 'Repeats monthly', pl: 'Powtarza się co miesiąc', uk: 'Повторюється щомісяця', es: 'Se repite cada mes' },
  'Návrhy': { en: 'Suggestions', pl: 'Propozycje', uk: 'Пропозиції', es: 'Sugerencias' },
  'Co rozdělit': { en: 'What to split', pl: 'Co podzielić', uk: 'Що розподілити', es: 'Qué repartir' },
  'cíl': { en: 'target', pl: 'cel', uk: 'ціль', es: 'meta' },
  'cíl {p} %': { en: 'target {p} %', pl: 'cel {p} %', uk: 'ціль {p} %', es: 'meta {p} %' },
  'Přidat': { en: 'Add', pl: 'Dodaj', uk: 'Додати', es: 'Añadir' },
  // category deep explanations (Tipy)
  'Tři kategorie, tři role': { en: 'Three categories, three roles', pl: 'Trzy kategorie, trzy role', uk: 'Три категорії, три ролі', es: 'Tres categorías, tres papeles' },
  'Pevný základ života. Patří sem nájem, energie, jídlo, doprava — výdaje, které se opakují a drží tě v bezpečí. Pravidlo 50 / 30 / 20 jim dává polovinu příjmu; když potřebují výrazně víc, podívej se, kde uvolnit tlak.': { en: 'The solid base of life: rent, utilities, food, transport — recurring costs that keep you safe. The 50 / 30 / 20 rule gives them half of your income; if they need much more, look for where to ease the pressure.', pl: 'Solidna podstawa życia: czynsz, media, jedzenie, transport — powtarzalne koszty, które dają poczucie bezpieczeństwa. Zasada 50 / 30 / 20 przeznacza na nie połowę dochodu; jeśli potrzebują znacznie więcej, poszukaj, gdzie zmniejszyć presję.', uk: 'Міцна основа життя: оренда, комуналка, їжа, транспорт — регулярні витрати, що тримають тебе в безпеці. Правило 50 / 30 / 20 відводить їм половину доходу; якщо їм потрібно значно більше, пошукай, де послабити тиск.', es: 'La base sólida de la vida: alquiler, servicios, comida, transporte — gastos recurrentes que te dan seguridad. La regla 50 / 30 / 20 les asigna la mitad de tus ingresos; si necesitan mucho más, busca dónde aliviar la presión.' },
  'Tvoje budoucí svoboda. Spoření, rezerva a investice, které dnes odkládáš pro sebe zítra. Díky složenému úročení může s časem růst i malá částka — jak, ukáže simulátor.': { en: 'Your future freedom: savings, a reserve and investments you set aside today for tomorrow’s you. With compounding, even a small amount can grow over time — the simulator shows how.', pl: 'Twoja przyszła wolność: oszczędności, rezerwa i inwestycje, które dziś odkładasz dla siebie z jutra. Dzięki procentowi składanemu nawet mała kwota może z czasem rosnąć — jak, pokaże symulator.', uk: 'Твоя майбутня свобода: заощадження, резерв та інвестиції, які ти сьогодні відкладаєш для себе завтрашнього. Завдяки складному відсотку навіть невелика сума може з часом рости — як саме, покаже симулятор.', es: 'Tu libertad futura: ahorro, una reserva e inversiones que apartas hoy para tu yo de mañana. Con el interés compuesto, incluso una cantidad pequeña puede crecer con el tiempo: el simulador muestra cómo.' },
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

  // ── add expense (FAB + sheet) ──
  'Nový výdaj': { en: 'New expense', pl: 'Nowy wydatek', uk: 'Нова витрата', es: 'Nuevo gasto' },
  'Přidat výdaj': { en: 'Add expense', pl: 'Dodaj wydatek', uk: 'Додати витрату', es: 'Añadir gasto' },
  'Za co to bylo?': { en: 'What was it for?', pl: 'Za co to było?', uk: 'За що це було?', es: '¿En qué fue?' },
  'Opakované': { en: 'Repeated', pl: 'Powtarzane', uk: 'Повторювані', es: 'Repetidos' },
  'Poslední výdaje': { en: 'Recent expenses', pl: 'Ostatnie wydatki', uk: 'Останні витрати', es: 'Gastos recientes' },
  'Smazat': { en: 'Delete', pl: 'Usuń', uk: 'Видалити', es: 'Eliminar' },
  'Celkem tento měsíc {v}': { en: 'Total this month {v}', pl: 'Razem w tym miesiącu {v}', uk: 'Усього цього місяця {v}', es: 'Total este mes {v}' },
  'Zpět': { en: 'Back', pl: 'Wstecz', uk: 'Назад', es: 'Atrás' },
  'Vrátit zpět': { en: 'Undo', pl: 'Cofnij', uk: 'Скасувати', es: 'Deshacer' },
  'Smazáno: {n}': { en: 'Deleted: {n}', pl: 'Usunięto: {n}', uk: 'Видалено: {n}', es: 'Eliminado: {n}' },
  'zbývá {v}': { en: '{v} left', pl: 'zostało {v}', uk: 'залишилось {v}', es: 'quedan {v}' },
  'přes o {v}': { en: '{v} over', pl: 'przekroczono o {v}', uk: 'перевищено на {v}', es: '{v} de más' },
  'Nákup potravin': { en: 'Groceries', pl: 'Zakupy spożywcze', uk: 'Продукти', es: 'Compra' },
  'Benzín': { en: 'Fuel', pl: 'Paliwo', uk: 'Пальне', es: 'Gasolina' },
  'Lékárna': { en: 'Pharmacy', pl: 'Apteka', uk: 'Аптека', es: 'Farmacia' },
  'Káva': { en: 'Coffee', pl: 'Kawa', uk: 'Кава', es: 'Café' },
  'Restaurace': { en: 'Restaurant', pl: 'Restauracja', uk: 'Ресторан', es: 'Restaurante' },
  'Dárek': { en: 'Gift', pl: 'Prezent', uk: 'Подарунок', es: 'Regalo' },

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

  // ── goal names ──
  'Nouzová rezerva': { en: 'Emergency fund', pl: 'Fundusz awaryjny', uk: 'Резервний фонд', es: 'Fondo de emergencia' },
  'Investice · ETF': { en: 'Investments · ETF', pl: 'Inwestycje · ETF', uk: 'Інвестиції · ETF', es: 'Inversiones · ETF' },
  'Dovolená · Toskánsko': { en: 'Holiday · Tuscany', pl: 'Wakacje · Toskania', uk: 'Відпустка · Тоскана', es: 'Vacaciones · Toscana' },
  'Nový notebook': { en: 'New laptop', pl: 'Nowy laptop', uk: 'Новий ноутбук', es: 'Portátil nuevo' },

  // ── Tipy ──
  'Malé návyky s penězi. Klepni na kartu a otoč ji — čeká tě malá zajímavost.': { en: 'Small habits with money. Tap a card and flip it — a little fact awaits.', pl: 'Małe nawyki związane z pieniędzmi. Dotknij karty i obróć ją — czeka cię ciekawostka.', uk: 'Маленькі звички з грошима. Торкнись картки й переверни — на тебе чекає цікавинка.', es: 'Pequeños hábitos con el dinero. Toca una tarjeta y gírala — te espera una curiosidad.' },
  'Otoč pro zajímavost': { en: 'Flip for a fact', pl: 'Obróć po ciekawostkę', uk: 'Переверни для цікавинки', es: 'Gira para un dato' },
  'Zpět na tip': { en: 'Back to tip', pl: 'Wróć do porady', uk: 'Назад до поради', es: 'Volver al consejo' },
  'Pravidlo 24 hodin': { en: 'The 24-hour rule', pl: 'Zasada 24 godzin', uk: 'Правило 24 годин', es: 'La regla de 24 horas' },
  'Zaplať nejdřív budoucí já': { en: 'Pay your future self first', pl: 'Najpierw zapłać przyszłemu sobie', uk: 'Спершу заплати майбутньому собі', es: 'Págate primero a tu yo futuro' },
  'Hned po výplatě odlož 20\u00a0% stranou, než se peníze „rozkutálí".':
    { en: 'Right after payday, set aside 20% before the money "rolls away".',
      pl: 'Zaraz po wypłacie odłóż 20% na bok, zanim pieniądze się „rozejdą".',
      uk: 'Одразу після зарплати відклади 20%, поки гроші не «розкотилися».',
      es: 'Justo tras cobrar, aparta el 20% antes de que el dinero "se escurra".' },
  'Radost není luxus': { en: 'Joy is not a luxury', pl: 'Radość to nie luksus', uk: 'Радість — не розкіш', es: 'La alegría no es un lujo' },
  'Pojmenuj své cíle': { en: 'Name your goals', pl: 'Nazwij swoje cele', uk: 'Назви свої цілі', es: 'Nombra tus metas' },
  'Věděla jsi?': { en: 'Did you know?', pl: 'Czy wiesz?', uk: 'Чи знала ти?', es: '¿Sabías que?' },
  'Zážitky > věci': { en: 'Experiences > things', pl: 'Przeżycia > rzeczy', uk: 'Враження > речі', es: 'Experiencias > cosas' },
  'Síla jména': { en: 'The power of a name', pl: 'Siła nazwy', uk: 'Сила імені', es: 'El poder de un nombre' },

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

  // ── Reflexe ──
  'Jak ti bylo s penězi?': { en: 'How did money feel?', pl: 'Jak było ci z pieniędzmi?', uk: 'Як тобі було з грошима?', es: '¿Cómo te fue con el dinero?' },
  'Stísněně': { en: 'Tense', pl: 'Z napięciem', uk: 'Напружено', es: 'Tenso' },
  'V rovnováze': { en: 'Balanced', pl: 'W równowadze', uk: 'У рівновазі', es: 'En equilibrio' },
  'S radostí': { en: 'Joyful', pl: 'Z radością', uk: 'З радістю', es: 'Con alegría' },
  'Otázky měsíce': { en: 'Questions of the month', pl: 'Pytania miesiąca', uk: 'Питання місяця', es: 'Preguntas del mes' },
  // reflexe quiz
  'Odpověz na pár otázek a podívej se, jak ti tento měsíc bylo s penězi.': { en: 'Answer a few questions and see how money felt this month.', pl: 'Odpowiedz na kilka pytań i zobacz, jak było ci z pieniędzmi w tym miesiącu.', uk: 'Дай відповідь на кілька запитань і подивись, як тобі цього місяця велося з грошима.', es: 'Responde unas preguntas y mira cómo te fue con el dinero este mes.' },
  'Shrnutí měsíce': { en: 'Month summary', pl: 'Podsumowanie miesiąca', uk: 'Підсумок місяця', es: 'Resumen del mes' },
  'odpovězeno': { en: 'answered', pl: 'odpowiedzi', uk: 'відповідей', es: 'respondidas' },
  'Odpověz na všechny otázky a ukáže se tvé hodnocení i tip na příští měsíc.': { en: 'Answer all the questions to reveal your score and a tip for next month.', pl: 'Odpowiedz na wszystkie pytania, aby zobaczyć ocenę i wskazówkę na przyszły miesiąc.', uk: 'Дай відповідь на всі запитання, щоб побачити оцінку й пораду на наступний місяць.', es: 'Responde todas las preguntas para ver tu valoración y un consejo para el próximo mes.' },
  'Hodnocení': { en: 'Score', pl: 'Ocena', uk: 'Оцінка', es: 'Valoración' },
  'Tento měsíc:': { en: 'This month:', pl: 'Ten miesiąc:', uk: 'Цей місяць:', es: 'Este mes:' },
  'Tip na příští měsíc': { en: 'Tip for next month', pl: 'Wskazówka na przyszły miesiąc', uk: 'Порада на наступний місяць', es: 'Consejo para el próximo mes' },
  'Vyplnit znovu': { en: 'Retake', pl: 'Wypełnij ponownie', uk: 'Пройти знову', es: 'Rehacer' },
  // quiz questions
  'Když tento měsíc přišly peníze, co se dělo?': { en: 'When money came in this month, what happened?', pl: 'Gdy w tym miesiącu pojawiły się pieniądze, co się działo?', uk: 'Коли цього місяця прийшли гроші, що сталося?', es: 'Cuando llegó el dinero este mes, ¿qué pasó?' },
  'Hned se rozkutálely, ani nevím kam': { en: 'They scattered at once, I don\u2019t even know where', pl: 'Od razu się rozeszły, nawet nie wiem gdzie', uk: 'Одразу розкотилися, навіть не знаю куди', es: 'Se esfumaron enseguida, ni sé adónde' },
  'Něco jsem utratila, něco zůstalo náhodou': { en: 'I spent some, some stayed by chance', pl: 'Coś wydałam, coś zostało przypadkiem', uk: 'Щось витратила, щось лишилось випадково', es: 'Gasté algo, quedó algo por casualidad' },
  'Většinu jsem rozdělila podle plánu': { en: 'I split most of it by plan', pl: 'Większość rozdzieliłam według planu', uk: 'Більшість розподілила за планом', es: 'Repartí la mayoría según el plan' },
  'Nejdřív jsem odložila pro budoucí já, pak utrácela': { en: 'I set aside for future me first, then spent', pl: 'Najpierw odłożyłam dla przyszłej siebie, potem wydawałam', uk: 'Спершу відклала для майбутньої себе, потім витрачала', es: 'Primero aparté para mi yo futuro, luego gasté' },
  'Jak ses cítila u větších výdajů?': { en: 'How did you feel about bigger purchases?', pl: 'Jak czułaś się przy większych wydatkach?', uk: 'Як ти почувалася при більших витратах?', es: '¿Cómo te sentiste con los gastos grandes?' },
  'S úzkostí, často je lituju': { en: 'Anxious, I often regret them', pl: 'Z niepokojem, często ich żałuję', uk: 'З тривогою, часто шкодую', es: 'Con ansiedad, suelo arrepentirme' },
  'Napětí, ale nějak to šlo': { en: 'Tense, but it worked out', pl: 'Napięcie, ale jakoś szło', uk: 'Напружено, але якось ішло', es: 'Tensa, pero salió bien' },
  'Klidně — byly promyšlené': { en: 'Calm — they were thought through', pl: 'Spokojnie — były przemyślane', uk: 'Спокійно — вони були продумані', es: 'Tranquila — fueron pensados' },
  'S radostí, věděla jsem, že si je můžu dovolit': { en: 'Joyfully, I knew I could afford them', pl: 'Z radością, wiedziałam, że mnie na nie stać', uk: 'З радістю, я знала, що можу їх собі дозволити', es: 'Con alegría, sabía que podía permitírmelos' },
  'Kolik šlo do „Budoucí já" (spoření a investice)?': { en: 'How much went to "Future me" (savings & investments)?', pl: 'Ile poszło na „Przyszłą mnie" (oszczędności i inwestycje)?', uk: 'Скільки пішло на «Майбутню себе» (заощадження та інвестиції)?', es: '¿Cuánto fue a "Mi yo futuro" (ahorro e inversión)?' },
  'Nic, nezbylo': { en: 'Nothing, none left', pl: 'Nic, nie zostało', uk: 'Нічого, не лишилось', es: 'Nada, no sobró' },
  'Pár korun na konci měsíce': { en: 'A few coins at month\u2019s end', pl: 'Parę groszy na koniec miesiąca', uk: 'Кілька монет наприкінці місяця', es: 'Unas monedas a fin de mes' },
  'Skoro podle cíle': { en: 'Almost on target', pl: 'Prawie zgodnie z celem', uk: 'Майже за ціллю', es: 'Casi según la meta' },
  'Celý cíl, hned po výplatě': { en: 'The full target, right after payday', pl: 'Cały cel, zaraz po wypłacie', uk: 'Уся ціль, одразу після зарплати', es: 'La meta entera, justo tras cobrar' },
  'Jak to bylo s radostí a drobným potěšením?': { en: 'How was it with joy and little pleasures?', pl: 'Jak było z radością i drobnymi przyjemnościami?', uk: 'Як було з радістю та маленькими задоволеннями?', es: '¿Cómo fue con la alegría y los pequeños gustos?' },
  'Buď vina, nebo úplné odříkání': { en: 'Either guilt or total denial', pl: 'Albo poczucie winy, albo całkowite wyrzeczenie', uk: 'Або провина, або повне зречення', es: 'O culpa o privación total' },
  'Náhodně, bez plánu': { en: 'Randomly, without a plan', pl: 'Przypadkowo, bez planu', uk: 'Випадково, без плану', es: 'Al azar, sin plan' },
  'Občas naplánované': { en: 'Sometimes planned', pl: 'Czasem zaplanowane', uk: 'Іноді заплановані', es: 'A veces planeados' },
  'Vědomě naplánovaná, bez výčitek': { en: 'Consciously planned, guilt-free', pl: 'Świadomie zaplanowane, bez wyrzutów', uk: 'Свідомо заплановані, без докорів', es: 'Planeados a conciencia, sin culpa' },
  // result tips
  'Zkus jedinou změnu: hned po výplatě odlož 10 % stranou, než cokoli utratíš. V příští reflexi uvidíš, jak to šlo.': { en: 'Try one change: right after payday set aside 10% before spending anything. Next reflection will show you how it went.', pl: 'Spróbuj jednej zmiany: zaraz po wypłacie odłóż 10% przed wydawaniem. W kolejnej refleksji zobaczysz, jak poszło.', uk: 'Спробуй одну зміну: одразу після зарплати відклади 10%, перш ніж щось витрачати. У наступній рефлексії побачиш, як це вдалося.', es: 'Prueba un cambio: justo tras cobrar aparta el 10% antes de gastar. En la próxima reflexión verás cómo te fue.' },
  'Máš pevný základ. Tento měsíc zkus pojmenovat jeden konkrétní cíl a posílat na něj pravidelnou částku. V příští reflexi uvidíš, kam se cíl posunul.': { en: 'You have a solid base. This month, name one concrete goal and send it a regular amount. Next reflection will show you how far the goal has moved.', pl: 'Masz solidną podstawę. W tym miesiącu nazwij jeden konkretny cel i wysyłaj na niego regularną kwotę. W kolejnej refleksji zobaczysz, jak cel się przybliżył.', uk: 'У тебе міцна основа. Цього місяця назви одну конкретну ціль і надсилай на неї регулярну суму. У наступній рефлексії побачиш, наскільки ціль наблизилась.', es: 'Tienes una base sólida. Este mes, nombra una meta concreta y envíale una cantidad regular. En la próxima reflexión verás cuánto ha avanzado la meta.' },
  'Krásná práce. Udrž si to: zautomatizuj spoření a dopřej si bez výčitek jednu naplánovanou radost. Můžeš zvážit i mírné zvýšení investic.': { en: 'Beautiful work. Keep it up: automate saving and treat yourself to one planned joy, guilt-free. You might even raise your investments a little.', pl: 'Piękna robota. Tak trzymaj: zautomatyzuj oszczędzanie i pozwól sobie bez wyrzutów na jedną zaplanowaną przyjemność. Możesz też lekko zwiększyć inwestycje.', uk: 'Чудова робота. Так тримай: автоматизуй заощадження й дозволь собі без докорів одну заплановану радість. Можеш навіть трохи збільшити інвестиції.', es: 'Buen trabajo. Sigue así: automatiza el ahorro y date un gusto planeado sin culpa. Incluso podrías subir un poco las inversiones.' },
  // mood 0 — tense
  'Co mě tento měsíc nejvíc tlačilo — a šlo by to příště zmírnit?': { en: 'What pressed on me most this month — and could it be eased next time?', pl: 'Co najbardziej mnie uciskało w tym miesiącu — i czy da się to złagodzić?', uk: 'Що цього місяця тиснуло на мене найбільше — і чи можна це пом\u2019якшити?', es: '¿Qué me agobió más este mes — y podría aliviarse la próxima vez?' },
  'Kdy jsem utrácela ze stresu nebo úzkosti, ne z potřeby?': { en: 'When did I spend from stress or anxiety, not need?', pl: 'Kiedy wydawałam ze stresu lub lęku, a nie z potrzeby?', uk: 'Коли я витрачала від стресу чи тривоги, а не з потреби?', es: '¿Cuándo gasté por estrés o ansiedad, no por necesidad?' },
  'Který jediný výdaj mi vzal nejvíc klidu?': { en: 'Which single expense cost me the most peace?', pl: 'Który jeden wydatek odebrał mi najwięcej spokoju?', uk: 'Яка одна витрата забрала в мене найбільше спокою?', es: '¿Qué único gasto me quitó más tranquilidad?' },
  'Co malého bych mohla změnit, aby mi příští měsíc bylo líp?': { en: 'What small thing could I change to feel better next month?', pl: 'Co małego mogłabym zmienić, by w przyszłym miesiącu było mi lepiej?', uk: 'Що мале я могла б змінити, щоб наступного місяця було легше?', es: '¿Qué cosa pequeña podría cambiar para estar mejor el mes que viene?' },
  'Za co můžu být i tak vděčná, navzdory tíze?': { en: 'What can I still be grateful for, despite the weight?', pl: 'Za co mimo wszystko mogę być wdzięczna?', uk: 'За що я все одно можу бути вдячна, попри тягар?', es: '¿Por qué puedo estar agradecida a pesar del peso?' },
  // mood 1 — balanced
  'Co mi tento měsíc fungovalo a chci v tom pokračovat?': { en: 'What worked for me this month that I want to keep doing?', pl: 'Co działało w tym miesiącu i chcę to kontynuować?', uk: 'Що цього місяця спрацювало і я хочу це продовжити?', es: '¿Qué me funcionó este mes y quiero seguir haciendo?' },
  'Kde jsem našla rovnováhu mezi „teď" a „budoucí já"?': { en: 'Where did I find balance between "now" and "future me"?', pl: 'Gdzie znalazłam równowagę między „teraz" a „przyszłym ja"?', uk: 'Де я знайшла баланс між «зараз» і «майбутнім я»?', es: '¿Dónde encontré equilibrio entre el "ahora" y mi "yo futuro"?' },
  'Který výdaj se mi teď zdá zbytečný — a co bych za něj raději měla?': { en: 'Which expense now seems pointless — and what would I rather have instead?', pl: 'Który wydatek wydaje się teraz zbędny — i co wolałabym zamiast niego?', uk: 'Яка витрата тепер здається зайвою — і що б я радше мала замість неї?', es: '¿Qué gasto parece ahora innecesario — y qué preferiría en su lugar?' },
  'Co dobrého jsem udělala pro své „budoucí já"?': { en: 'What good did I do for my "future self"?', pl: 'Co dobrego zrobiłam dla swojego „przyszłego ja"?', uk: 'Що доброго я зробила для свого «майбутнього я»?', es: '¿Qué hice de bueno por mi "yo futuro"?' },
  'Co bych příští měsíc zkusila trochu jinak?': { en: 'What would I try a little differently next month?', pl: 'Co spróbowałabym zrobić trochę inaczej w przyszłym miesiącu?', uk: 'Що я спробувала б трохи інакше наступного місяця?', es: '¿Qué intentaría un poco diferente el próximo mes?' },
  // mood 2 — joyful
  'Co mi tento měsíc udělalo největší radost — a stálo to méně, než bych čekala?': { en: 'What brought me the most joy this month — and cost less than I expected?', pl: 'Co sprawiło mi największą radość — a kosztowało mniej, niż myślałam?', uk: 'Що цього місяця принесло найбільше радості — і коштувало менше, ніж я очікувала?', es: '¿Qué me dio más alegría este mes — y costó menos de lo que esperaba?' },
  'Který nákup za to opravdu stál a vrátil se mi v podobě radosti?': { en: 'Which purchase was truly worth it and gave joy back?', pl: 'Który zakup naprawdę był tego wart i zwrócił się radością?', uk: 'Яка покупка справді була варта того й повернулася радістю?', es: '¿Qué compra valió la pena de verdad y me devolvió alegría?' },
  'Jak se mi podařilo spojit potěšení s rozvahou?': { en: 'How did I manage to pair pleasure with prudence?', pl: 'Jak udało mi się połączyć przyjemność z rozwagą?', uk: 'Як мені вдалося поєднати задоволення з розважливістю?', es: '¿Cómo logré unir el placer con la prudencia?' },
  'Čím se odměním, až splním další cíl?': { en: 'How will I reward myself when I reach the next goal?', pl: 'Czym się nagrodzę, gdy osiągnę kolejny cel?', uk: 'Чим я винагороджу себе, коли досягну наступної цілі?', es: '¿Cómo me recompensaré al alcanzar la próxima meta?' },
  'Co bych poradila kamarádce, aby se měla s penězi takhle dobře?': { en: 'What would I tell a friend so she could do this well with money too?', pl: 'Co poradziłabym przyjaciółce, by też tak dobrze radziła sobie z pieniędzmi?', uk: 'Що б я порадила подрузі, щоб і їй так добре велося з грошима?', es: '¿Qué le diría a una amiga para que le fuera así de bien con el dinero?' },
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

  // ── Více ──
  'Účet': { en: 'Account', pl: 'Konto', uk: 'Обліковий запис', es: 'Cuenta' },
  'Osobní profil': { en: 'Personal profile', pl: 'Profil osobisty', uk: 'Особистий профіль', es: 'Perfil personal' },
  'Zabezpečení': { en: 'Security', pl: 'Bezpieczeństwo', uk: 'Безпека', es: 'Seguridad' },
  'Pravidlo 50 / 30 / 20': { en: '50 / 30 / 20 rule', pl: 'Zasada 50 / 30 / 20', uk: 'Правило 50 / 30 / 20', es: 'Regla 50 / 30 / 20' },
  'Upravit poměry': { en: 'Edit ratios', pl: 'Edytuj proporcje', uk: 'Змінити пропорції', es: 'Editar proporciones' },
  'Jemné připomínky': { en: 'Gentle reminders', pl: 'Łagodne przypomnienia', uk: 'Делікатні нагадування', es: 'Recordatorios suaves' },
  'Vědomé utrácení': { en: 'Mindful Spending', pl: 'Świadome wydawanie', uk: 'Усвідомлені витрати', es: 'Gasto Consciente' },
  'Zapnuto': { en: 'On', pl: 'Włączone', uk: 'Увімкнено', es: 'Activado' },
  'Vzhled': { en: 'Appearance', pl: 'Wygląd', uk: 'Вигляд', es: 'Apariencia' },
  'Jazyk': { en: 'Language', pl: 'Język', uk: 'Мова', es: 'Idioma' },
  'Lesní klid': { en: 'Forest Calm', pl: 'Leśny spokój', uk: 'Лісовий спокій', es: 'Calma del bosque' },
  'Kouzelnický': { en: 'Wizardly', pl: 'Czarodziejski', uk: 'Чарівний', es: 'Mágico' },
  'verze {v}': { en: 'version {v}', pl: 'wersja {v}', uk: 'версія {v}', es: 'versión {v}' },
  // ── batch 2026-09: months, dates, backup, reminders, neutral wording ──
  'Datum': { en: 'Date', pl: 'Data', uk: 'Дата', es: 'Fecha' },
  'Celkem za {m}: {v}': { en: 'Total for {m}: {v}', pl: 'Razem za {m}: {v}', uk: 'Разом за {m}: {v}', es: 'Total de {m}: {v}' },
  'Další krok: v Plánu rozepiš, co patří do Potřebných — nájem, energie, jídlo.': { en: 'Next step: in Plan, list what belongs to Need — rent, energy, food.', pl: 'Następny krok: w Planie rozpisz, co należy do Niezbędnych — czynsz, energia, jedzenie.', uk: 'Наступний крок: у Плані розпиши, що належить до Необхідного — оренда, енергія, їжа.', es: 'Siguiente paso: en el Plan detalla lo que va a Esenciales — alquiler, energía, comida.' },
  'Rozepsat měsíční plán': { en: 'Break down the monthly plan', pl: 'Rozpisz plan miesięczny', uk: 'Розписати місячний план', es: 'Detallar el plan mensual' },
  // the plan in one tap (an empty plan on Overview and Plan)
  'Plán na {m} je zatím prázdný. Začni svým rozdělením — po položkách ho rozepíšeš později.': { en: 'The plan for {m} is still empty. Start with your split and break it down item by item later.', pl: 'Plan na {m} jest jeszcze pusty. Zacznij od swojego podziału — na pozycje rozpiszesz go później.', uk: 'План на {m} поки порожній. Почни зі свого розподілу — по статтях розпишеш його пізніше.', es: 'El plan de {m} aún está vacío. Empieza con tu reparto y detállalo partida a partida más tarde.' },
  'Zapsat {r} do plánu': { en: 'Put {r} into the plan', pl: 'Wpisz {r} do planu', uk: 'Записати {r} у план', es: 'Pasar {r} al plan' },
  'V plánu: {r}': { en: 'In the plan: {r}', pl: 'W planie: {r}', uk: 'У плані: {r}', es: 'En el plan: {r}' },
  'Zatím vcelku': { en: 'Not split yet', pl: 'W całości', uk: 'Ще не поділено', es: 'Sin desglosar' },
  'Vyber měsíc': { en: 'Choose a month', pl: 'Wybierz miesiąc', uk: 'Обери місяць', es: 'Elige un mes' },
  'Předchozí rok': { en: 'Previous year', pl: 'Poprzedni rok', uk: 'Попередній рік', es: 'Año anterior' },
  'Další rok': { en: 'Next year', pl: 'Następny rok', uk: 'Наступний рік', es: 'Año siguiente' },
  'Zpět na aktuální měsíc': { en: 'Back to the current month', pl: 'Wróć do bieżącego miesiąca', uk: 'Назад до поточного місяця', es: 'Volver al mes actual' },
  'Zapsat výdaje do Vědomého utrácení': { en: 'Log expenses in Mindful Spending', pl: 'Zapisz wydatki w Świadomym wydawaniu', uk: 'Записати витрати в Усвідомлених витратах', es: 'Anotar gastos en Gasto Consciente' },
  'Pár minut na zápis výdajů. Žádný stres.': { en: 'A few minutes to log your expenses. No stress.', pl: 'Kilka minut na zapisanie wydatków. Bez stresu.', uk: 'Кілька хвилин, щоб записати витрати. Без стресу.', es: 'Unos minutos para anotar tus gastos. Sin estrés.' },
  'PIN brání jen náhodnému nahlédnutí. Data zůstávají v tomto prohlížeči a nejsou šifrovaná.': { en: 'The PIN only stops a casual glance. Your data stays in this browser and is not encrypted.', pl: 'PIN chroni tylko przed przypadkowym podejrzeniem. Dane zostają w tej przeglądarce i nie są szyfrowane.', uk: 'PIN захищає лише від випадкового погляду. Дані залишаються в цьому браузері й не шифруються.', es: 'El PIN solo evita miradas casuales. Los datos se quedan en este navegador y no están cifrados.' },
  'Aplikace běží v prohlížeči, takže sama upozornit neumí. Přidej si připomínku do kalendáře v telefonu nebo počítači — ozve se ve zvolený čas.': { en: 'The app runs in your browser, so it can\'t notify you by itself. Add a reminder to the calendar on your phone or computer — it will ping you at the chosen time.', pl: 'Aplikacja działa w przeglądarce, więc sama nie powiadomi. Dodaj przypomnienie do kalendarza w telefonie lub komputerze — odezwie się o wybranej porze.', uk: 'Застосунок працює в браузері, тож сам нагадати не може. Додай нагадування в календар на телефоні чи комп\'ютері — воно спрацює у вибраний час.', es: 'La app funciona en el navegador, así que no puede avisarte sola. Añade un recordatorio al calendario del móvil o del ordenador: sonará a la hora elegida.' },
  'Přidat do kalendáře': { en: 'Add to calendar', pl: 'Dodaj do kalendarza', uk: 'Додати в календар', es: 'Añadir al calendario' },
  'Soubor s připomínkou se stáhl. Otevři ho a potvrď přidání do kalendáře.': { en: 'The reminder file has downloaded. Open it and confirm adding it to your calendar.', pl: 'Plik z przypomnieniem został pobrany. Otwórz go i potwierdź dodanie do kalendarza.', uk: 'Файл із нагадуванням завантажено. Відкрий його й підтвердь додавання в календар.', es: 'Se ha descargado el archivo del recordatorio. Ábrelo y confirma que se añada al calendario.' },
  'Označit jako vypnuté': { en: 'Mark as off', pl: 'Oznacz jako wyłączone', uk: 'Позначити як вимкнене', es: 'Marcar como desactivado' },
  'V kalendáři': { en: 'In calendar', pl: 'W kalendarzu', uk: 'У календарі', es: 'En el calendario' },
  'Zálohovat data do souboru': { en: 'Back up data to a file', pl: 'Zapisz kopię danych do pliku', uk: 'Зберегти резервну копію у файл', es: 'Guardar copia de seguridad en un archivo' },
  'Data jsou jen v tomto prohlížeči. Záloha je pojistka i cesta na jiné zařízení.': { en: 'Your data lives only in this browser. A backup keeps it safe and lets you move to another device.', pl: 'Dane są tylko w tej przeglądarce. Kopia to zabezpieczenie i sposób na przeniesienie na inne urządzenie.', uk: 'Дані є лише в цьому браузері. Резервна копія — це страховка й спосіб перенести їх на інший пристрій.', es: 'Tus datos solo están en este navegador. La copia es un seguro y la forma de pasarlos a otro dispositivo.' },
  'Obnovit ze zálohy': { en: 'Restore from backup', pl: 'Przywróć z kopii', uk: 'Відновити з резервної копії', es: 'Restaurar desde copia' },
  'Nahradí současná data obsahem souboru': { en: 'Replaces the current data with the file\'s contents', pl: 'Zastąpi obecne dane zawartością pliku', uk: 'Замінить поточні дані вмістом файлу', es: 'Sustituye los datos actuales por el contenido del archivo' },
  'Záloha se stáhla. Ulož si ji na bezpečné místo.': { en: 'The backup has downloaded. Keep it somewhere safe.', pl: 'Kopia została pobrana. Zachowaj ją w bezpiecznym miejscu.', uk: 'Резервну копію завантажено. Збережи її в надійному місці.', es: 'Se ha descargado la copia. Guárdala en un lugar seguro.' },
  'Zálohu se nepodařilo vytvořit.': { en: 'The backup could not be created.', pl: 'Nie udało się utworzyć kopii.', uk: 'Не вдалося створити резервну копію.', es: 'No se pudo crear la copia.' },
  'Data obnovena. Načítám…': { en: 'Data restored. Loading…', pl: 'Dane przywrócone. Wczytuję…', uk: 'Дані відновлено. Завантажую…', es: 'Datos restaurados. Cargando…' },
  'Tenhle soubor nevypadá jako záloha Vědomého utrácení.': { en: 'This file doesn\'t look like a Mindful Spending backup.', pl: 'Ten plik nie wygląda na kopię Świadomego wydawania.', uk: 'Цей файл не схожий на резервну копію Усвідомлених витрат.', es: 'Este archivo no parece una copia de Gasto Consciente.' },
  'Soubor se nepodařilo přečíst.': { en: 'The file could not be read.', pl: 'Nie udało się odczytać pliku.', uk: 'Не вдалося прочитати файл.', es: 'No se pudo leer el archivo.' },
  'Zajímavost': { en: 'Fun fact', pl: 'Ciekawostka', uk: 'Цікавинка', es: 'Dato curioso' },
  'Za {y} let můžeš mít naspořeno': { en: 'In {y} years you could have saved', pl: 'Za {y} lat możesz mieć odłożone', uk: 'За {y} років можеш мати заощаджено', es: 'En {y} años podrías tener ahorrado' },
  'Výnos': { en: 'Gains', pl: 'Zysk', uk: 'Дохід', es: 'Ganancia' },
  'Něco se utratilo, něco zůstalo náhodou': { en: 'Some got spent, some was left by chance', pl: 'Coś się wydało, coś zostało przypadkiem', uk: 'Щось витратилося, щось лишилося випадково', es: 'Algo se gastó y algo quedó por casualidad' },
  'Většina šla podle plánu': { en: 'Most of it went to plan', pl: 'Większość poszła zgodnie z planem', uk: 'Більшість пішла за планом', es: 'Casi todo fue según el plan' },
  'Nejdřív stranou pro budoucí já, pak zbytek': { en: 'Future self first, then the rest', pl: 'Najpierw odłożone dla przyszłego ja, potem reszta', uk: 'Спершу відкладено для майбутнього себе, потім решта', es: 'Primero apartado para mi yo futuro, luego el resto' },
  'Jaké to bylo u větších výdajů?': { en: 'How did bigger purchases feel?', pl: 'Jak było przy większych wydatkach?', uk: 'Як було з більшими витратами?', es: '¿Cómo fueron los gastos grandes?' },
  'S radostí — bylo jasné, že si je můžu dovolit': { en: 'Joyful — it was clear I could afford them', pl: 'Z radością — było jasne, że mnie na nie stać', uk: 'Радісно — було ясно, що я можу собі їх дозволити', es: 'Con alegría: estaba claro que podía permitírmelos' },
  'Co mi tento měsíc udělalo radost, i když to stálo málo?': { en: 'What brought me joy this month even though it cost little?', pl: 'Co sprawiło mi w tym miesiącu radość, choć kosztowało niewiele?', uk: 'Що цього місяця потішило мене, хоча коштувало мало?', es: '¿Qué me dio alegría este mes aunque costó poco?' },
  'Který výdaj se mi teď zdá zbytečný — a co by mi za ty peníze udělalo větší radost?': { en: 'Which expense now seems pointless — and what would have made me happier for that money?', pl: 'Który wydatek wydaje mi się teraz zbędny — i co za te pieniądze dałoby mi więcej radości?', uk: 'Яка витрата тепер здається зайвою — і що за ці гроші потішило б мене більше?', es: '¿Qué gasto me parece ahora innecesario y qué me habría alegrado más con ese dinero?' },
  'Co dobrého se tento měsíc povedlo pro mé „budoucí já\"?': { en: 'What good did this month bring my \"future self\"?', pl: 'Co dobrego udało się w tym miesiącu dla mojego „przyszłego ja\"?', uk: 'Що доброго цього місяця вдалося для мого «майбутнього я»?', es: '¿Qué salió bien este mes para mi «yo futuro»?' },
  // ── demo data, tweaks panel and misc labels ──
  'spořák': { en: 'Savings account', pl: 'Konto oszczędnościowe', uk: 'Ощадний рахунок', es: 'Cuenta de ahorro' },
  'Nájem, energie, jídlo a vše, bez čeho to nejde.': { en: 'Rent, utilities, food and everything you cannot do without.', pl: 'Czynsz, energia, jedzenie i wszystko, bez czego się nie da.', uk: 'Оренда, енергія, їжа і все, без чого не обійтися.', es: 'Alquiler, energía, comida y todo lo imprescindible.' },
  'Téma': { en: 'Theme', pl: 'Motyw', uk: 'Тема', es: 'Tema' },
  'Styl': { en: 'Style', pl: 'Styl', uk: 'Стиль', es: 'Estilo' },
  'Pozadí': { en: 'Background', pl: 'Tło', uk: 'Тло', es: 'Fondo' },
  'Scéna': { en: 'Scene', pl: 'Scena', uk: 'Сцена', es: 'Escena' },
  'Pohyb': { en: 'Motion', pl: 'Ruch', uk: 'Рух', es: 'Movimiento' },
  'Atmosféra': { en: 'Atmosphere', pl: 'Atmosfera', uk: 'Атмосфера', es: 'Atmósfera' },
  'Karty': { en: 'Cards', pl: 'Karty', uk: 'Картки', es: 'Tarjetas' },
  'Hloubka': { en: 'Depth', pl: 'Głębia', uk: 'Глибина', es: 'Profundidad' },
  'Akcent': { en: 'Accent', pl: 'Akcent', uk: 'Акцент', es: 'Acento' },
  'Data (náhled)': { en: 'Data (preview)', pl: 'Dane (podgląd)', uk: 'Дані (перегляд)', es: 'Datos (vista previa)' },
  'Načíst ukázková data': { en: 'Load sample data', pl: 'Wczytaj przykładowe dane', uk: 'Завантажити зразкові дані', es: 'Cargar datos de ejemplo' },
  'Smazat data → onboarding': { en: 'Delete data → onboarding', pl: 'Usuń dane → onboarding', uk: 'Видалити дані → онбординг', es: 'Borrar datos → onboarding' },
  // ── batch 2026-11: plan × actual (monthly plans, expenses use up the plan) ──
  'Plán převzatý z měsíce {m}. Když ho upravíš, změna platí od tohoto měsíce dál.': { en: 'Plan carried over from {m}. If you change it, the change applies from this month on.', pl: 'Plan przeniesiony z miesiąca {m}. Jeśli go zmienisz, zmiana obowiązuje od tego miesiąca.', uk: 'План перенесено з місяця {m}. Якщо ти його зміниш, зміна діятиме від цього місяця.', es: 'Plan traído de {m}. Si lo cambias, el cambio vale desde este mes en adelante.' },
  'Plán se přenáší do dalších měsíců, dokud ho nezměníš. Položka bez opakování platí jen v tomto měsíci.': { en: 'The plan carries over to the next months until you change it. An item that does not repeat counts only this month.', pl: 'Plan przechodzi na kolejne miesiące, dopóki go nie zmienisz. Pozycja bez powtarzania liczy się tylko w tym miesiącu.', uk: 'План переходить на наступні місяці, доки ти його не зміниш. Позиція без повторення діє лише в цьому місяці.', es: 'El plan pasa a los meses siguientes hasta que lo cambies. Una partida que no se repite cuenta solo este mes.' },
  'v plánu': { en: 'on plan', pl: 'zgodnie z planem', uk: 'за планом', es: 'según el plan' },
  'jen tento měsíc': { en: 'this month only', pl: 'tylko w tym miesiącu', uk: 'лише цього місяця', es: 'solo este mes' },
  'Opakuje se měsíčně – {n}': { en: 'Repeats monthly – {n}', pl: 'Powtarza się co miesiąc – {n}', uk: 'Повторюється щомісяця – {n}', es: 'Se repite cada mes – {n}' },
  'Plán a skutečnost': { en: 'Plan vs. actual', pl: 'Plan a rzeczywistość', uk: 'План і реальність', es: 'Plan y realidad' },
  'utraceno {a} z {b}': { en: 'spent {a} of {b}', pl: 'wydano {a} z {b}', uk: 'витрачено {a} з {b}', es: 'gastado {a} de {b}' },
  'odloženo {a} z {b}': { en: 'put aside {a} of {b}', pl: 'odłożono {a} z {b}', uk: 'відкладено {a} з {b}', es: 'apartado {a} de {b}' },
  'přes plán o {v}': { en: '{v} over plan', pl: 'ponad plan o {v}', uk: 'понад план на {v}', es: '{v} por encima del plan' },
  'o {v} víc': { en: '{v} more', pl: 'o {v} więcej', uk: 'на {v} більше', es: '{v} más' },

  // ── workshop (fa-workshop.jsx, fa-app.jsx, fa-screens.jsx) ──
  'Workshop': { en: 'Workshop', pl: 'Warsztat', uk: 'Воркшоп', es: 'Taller' },
  'Příběh z workshopu': { en: 'Workshop story', pl: 'Historia z warsztatu', uk: 'Історія з воркшопу', es: 'Historia del taller' },
  'Pro lektora': { en: 'For the facilitator', pl: 'Dla prowadzącego', uk: 'Для ведучого', es: 'Para quien facilita' },
  'Odkaz, QR kód, časový plán a otázky': { en: 'Link, QR code, timing and questions', pl: 'Link, kod QR, plan czasowy i pytania', uk: 'Посилання, QR-код, розклад і запитання', es: 'Enlace, código QR, horario y preguntas' },
  'Ukončit a smazat': { en: 'End and delete', pl: 'Zakończ i usuń', uk: 'Завершити й видалити', es: 'Terminar y borrar' },
  'Opravdu smazat workshop?': { en: 'Really delete the workshop?', pl: 'Na pewno usunąć warsztat?', uk: 'Справді видалити воркшоп?', es: '¿Seguro que quieres borrar el taller?' },
  'Workshop Vědomého utrácení': { en: 'Mindful Spending workshop', pl: 'Warsztat Świadomego wydawania', uk: 'Воркшоп «Усвідомлені витрати»', es: 'Taller de Gasto Consciente' },
  'Vyber si příběh a projdi s ním pět krátkých úkolů. Postava i peníze jsou smyšlené, tak klidně zkoušej, co tě napadne.': { en: 'Pick a story and work through five short tasks with it. The person and the money are made up, so feel free to try anything.', pl: 'Wybierz historię i przejdź z nią pięć krótkich zadań. Postać i pieniądze są zmyślone, więc śmiało próbuj wszystkiego, co przyjdzie ci do głowy.', uk: 'Обери історію й пройди з нею п’ять коротких завдань. Персонаж і гроші вигадані, тож сміливо пробуй усе, що спаде на думку.', es: 'Elige una historia y haz con ella cinco tareas cortas. La persona y el dinero son inventados, así que prueba lo que se te ocurra.' },
  'Všechno zůstane jen v tomhle prohlížeči, odděleně od tvých vlastních dat, a na konci to jedním tlačítkem smažeš.': { en: 'Everything stays in this browser only, apart from your own data, and at the end you delete it with one button.', pl: 'Wszystko zostanie tylko w tej przeglądarce, osobno od twoich własnych danych, a na koniec usuniesz to jednym przyciskiem.', uk: 'Усе залишиться лише в цьому браузері, окремо від твоїх власних даних, а наприкінці ти видалиш це однією кнопкою.', es: 'Todo se queda solo en este navegador, separado de tus propios datos, y al final lo borras con un solo botón.' },
  'Vyber příběh': { en: 'Pick a story', pl: 'Wybierz historię', uk: 'Обери історію', es: 'Elige una historia' },
  'Začít s příběhem': { en: 'Start with this story', pl: 'Zacznij z tą historią', uk: 'Почати з цією історією', es: 'Empezar con esta historia' },
  'Příjem měsíčně': { en: 'Monthly income', pl: 'Dochód miesięcznie', uk: 'Дохід на місяць', es: 'Ingresos al mes' },
  'Utraceno tenhle měsíc': { en: 'Spent this month', pl: 'Wydane w tym miesiącu', uk: 'Витрачено цього місяця', es: 'Gastado este mes' },
  'Smyšlený příběh, částky jsou orientační.': { en: 'A made-up story; the amounts are illustrative.', pl: 'Zmyślona historia, kwoty są orientacyjne.', uk: 'Вигадана історія, суми орієнтовні.', es: 'Una historia inventada; las cantidades son orientativas.' },
  'Úkoly': { en: 'Tasks', pl: 'Zadania', uk: 'Завдання', es: 'Tareas' },
  'Hotovo {done} z {all}': { en: '{done} of {all} done', pl: 'Zrobione {done} z {all}', uk: 'Виконано {done} з {all}', es: '{done} de {all} hechas' },
  'Konec workshopu': { en: 'End of the workshop', pl: 'Koniec warsztatu', uk: 'Кінець воркшопу', es: 'Fin del taller' },
  'Na konci workshop smaž, na sdíleném zařízení vždycky. Tvoje vlastní data v tomhle prohlížeči zůstanou, jak byla.': { en: 'At the end, delete the workshop, and always on a shared device. Your own data in this browser stays as it was.', pl: 'Na koniec usuń warsztat, a na wspólnym urządzeniu zawsze. Twoje własne dane w tej przeglądarce zostaną bez zmian.', uk: 'Наприкінці видали воркшоп, а на спільному пристрої — завжди. Твої власні дані в цьому браузері залишаться такими, як були.', es: 'Al final, borra el taller, y en un dispositivo compartido siempre. Tus propios datos en este navegador se quedan como estaban.' },
  'Jak začít': { en: 'How to start', pl: 'Jak zacząć', uk: 'Як почати', es: 'Cómo empezar' },
  'QR kód s odkazem na workshop': { en: 'QR code with the workshop link', pl: 'Kod QR z linkiem do warsztatu', uk: 'QR-код із посиланням на воркшоп', es: 'Código QR con el enlace al taller' },
  'Odkaz zkopírován': { en: 'Link copied', pl: 'Link skopiowany', uk: 'Посилання скопійовано', es: 'Enlace copiado' },
  'Kopírovat odkaz': { en: 'Copy link', pl: 'Kopiuj link', uk: 'Копіювати посилання', es: 'Copiar enlace' },
  'Ukaž QR kód nebo odkaz. Účastníci ho otevřou v prohlížeči telefonu: nic se neinstaluje a nikdo se nepřihlašuje. Po prvním načtení funguje workshop i bez připojení.': { en: 'Show the QR code or the link. Participants open it in their phone’s browser: nothing to install and no sign-in. After the first load, the workshop works offline too.', pl: 'Pokaż kod QR albo link. Uczestnicy otworzą go w przeglądarce telefonu: nic się nie instaluje i nikt się nie loguje. Po pierwszym załadowaniu warsztat działa też bez połączenia.', uk: 'Покажи QR-код або посилання. Учасники відкриють його в браузері телефона: нічого не встановлюється, і ніхто не входить в обліковий запис. Після першого завантаження воркшоп працює й без з’єднання.', es: 'Muestra el código QR o el enlace. Los participantes lo abren en el navegador del móvil: no hay nada que instalar ni que iniciar sesión. Tras la primera carga, el taller funciona también sin conexión.' },
  'Sada pro lektory': { en: 'Facilitator kit', pl: 'Materiały dla prowadzącego', uk: 'Набір для ведучого', es: 'Materiales para quien facilita' },
  'Plán lekce na 90 i 45 minut, pracovní listy k tisku, snímky a dotazník. Česky a anglicky.': { en: 'Lesson plans for 90 and 45 minutes, printable worksheets, slides and a questionnaire. In Czech and English.', pl: 'Plan lekcji na 90 i 45 minut, karty pracy do druku, slajdy i ankieta. Po czesku i po angielsku.', uk: 'План заняття на 90 і 45 хвилин, робочі аркуші для друку, слайди й анкета. Чеською та англійською.', es: 'Plan de clase de 90 y 45 minutos, fichas para imprimir, diapositivas y un cuestionario. En checo y en inglés.' },
  'Průvodce lekcí': { en: 'Lesson guide', pl: 'Przewodnik po lekcji', uk: 'Посібник до заняття', es: 'Guía de la clase' },
  'Pracovní listy a dotazník': { en: 'Worksheets and questionnaire', pl: 'Karty pracy i ankieta', uk: 'Робочі аркуші й анкета', es: 'Fichas y cuestionario' },
  'Snímky': { en: 'Slides', pl: 'Slajdy', uk: 'Слайди', es: 'Diapositivas' },
  'Časový plán, asi 45 minut': { en: 'Timing, about 45 minutes', pl: 'Plan czasowy, około 45 minut', uk: 'Розклад, приблизно 45 хвилин', es: 'Horario, unos 45 minutos' },
  '{n} min': { en: '{n} min', pl: '{n} min', uk: '{n} хв', es: '{n} min' },
  'Otázky k diskusi': { en: 'Questions to discuss', pl: 'Pytania do dyskusji', uk: 'Запитання для обговорення', es: 'Preguntas para comentar' },
  'Na konci': { en: 'At the end', pl: 'Na koniec', uk: 'Наприкінці', es: 'Al final' },
  'Ať každý klepne na Ukončit a smazat, na sdílených zařízeních vždycky. Na vlastním telefonu se workshop s daty účastníka nemíchá, i tak je dobré ho smazat.': { en: 'Have everyone tap End and delete, and always on shared devices. On a participant’s own phone the workshop never mixes with their data, but it is still good to delete it.', pl: 'Niech każdy stuknie Zakończ i usuń, a na wspólnych urządzeniach zawsze. Na własnym telefonie uczestnika warsztat nie miesza się z jego danymi, ale i tak warto go usunąć.', uk: 'Нехай кожен натисне «Завершити й видалити», а на спільних пристроях — завжди. На власному телефоні учасника воркшоп не змішується з його даними, але видалити його все одно варто.', es: 'Que todos toquen Terminar y borrar, y en dispositivos compartidos siempre. En el móvil propio de cada participante el taller no se mezcla con sus datos, pero conviene borrarlo igualmente.' },
  'Příběhy jsou smyšlené a částky orientační. Klidně je slovně uprav podle skupiny.': { en: 'The stories are made up and the amounts illustrative. Feel free to adapt them aloud to your group.', pl: 'Historie są zmyślone, a kwoty orientacyjne. Śmiało dopasuj je słownie do grupy.', uk: 'Історії вигадані, а суми орієнтовні. Сміливо адаптуй їх усно під свою групу.', es: 'Las historias son inventadas y las cantidades, orientativas. Puedes adaptarlas de palabra a tu grupo.' },
  'Ema, 19 let': { en: 'Ema, 19', pl: 'Ema, 19 lat', uk: 'Ema, 19 років', es: 'Ema, 19 años' },
  'Studentka s brigádou': { en: 'A student with a part-time job', pl: 'Studentka z pracą dorywczą', uk: 'Студентка з підробітком', es: 'Estudiante con un trabajo a tiempo parcial' },
  'Studuje první ročník a o víkendech pracuje v kavárně. Bydlí u rodičů, takže nájem ani jídlo doma neplatí. Telefon, dojíždění a zábavu ano.': { en: 'She is in her first year at university and works in a café at weekends. She lives with her parents, so she pays neither rent nor food at home, but she does pay for her phone, travel and fun.', pl: 'Studiuje na pierwszym roku i w weekendy pracuje w kawiarni. Mieszka z rodzicami, więc nie płaci ani czynszu, ani za jedzenie w domu. Za telefon, dojazdy i rozrywkę już tak.', uk: 'Навчається на першому курсі й на вихідних працює в кав’ярні. Живе з батьками, тож не платить ні за оренду, ні за їжу вдома. А от за телефон, проїзд і розваги платить сама.', es: 'Estudia primer curso y los fines de semana trabaja en una cafetería. Vive con sus padres, así que no paga alquiler ni la comida de casa, pero sí el móvil, el transporte y el ocio.' },
  'řidičák': { en: 'a driving licence', pl: 'prawo jazdy', uk: 'водійські права', es: 'el carné de conducir' },
  'Brigáda v kavárně': { en: 'Café job', pl: 'Praca w kawiarni', uk: 'Підробіток у кав’ярні', es: 'Trabajo en la cafetería' },
  'Kapesné od rodičů': { en: 'Pocket money from parents', pl: 'Kieszonkowe od rodziców', uk: 'Кишенькові від батьків', es: 'Paga de los padres' },
  'Telefon': { en: 'Phone', pl: 'Telefon', uk: 'Телефон', es: 'Móvil' },
  'Jízdenka na měsíc': { en: 'Monthly travel pass', pl: 'Bilet miesięczny', uk: 'Місячний проїзний', es: 'Abono mensual de transporte' },
  'Káva cestou do školy (12×)': { en: 'Coffee on the way to class (12×)', pl: 'Kawa w drodze na zajęcia (12×)', uk: 'Кава дорогою на навчання (12×)', es: 'Café de camino a clase (12×)' },
  'Tři streamovací služby': { en: 'Three streaming services', pl: 'Trzy serwisy streamingowe', uk: 'Три стримінгові сервіси', es: 'Tres servicios de streaming' },
  'Prasklý displej telefonu': { en: 'Cracked phone screen', pl: 'Pęknięty ekran telefonu', uk: 'Тріснутий екран телефона', es: 'Pantalla del móvil rota' },
  'Tomáš, 20 let': { en: 'Tomáš, 20', pl: 'Tomáš, 20 lat', uk: 'Tomáš, 20 років', es: 'Tomáš, 20 años' },
  'První výplata': { en: 'First paycheck', pl: 'Pierwsza wypłata', uk: 'Перша зарплата', es: 'Primer sueldo' },
  'Po maturitě nastoupil do první práce. Bydlí v pronajatém pokoji a poprvé platí všechno sám.': { en: 'After finishing school he started his first job. He rents a room and is paying for everything himself for the first time.', pl: 'Po maturze zaczął pierwszą pracę. Wynajmuje pokój i pierwszy raz za wszystko płaci sam.', uk: 'Після школи влаштувався на першу роботу. Винаймає кімнату й уперше за все платить сам.', es: 'Después del bachillerato empezó su primer trabajo. Alquila una habitación y por primera vez lo paga todo él solo.' },
  'rezerva na tři měsíce': { en: 'a three-month cushion', pl: 'poduszka na trzy miesiące', uk: 'резерв на три місяці', es: 'un colchón para tres meses' },
  'Výplata': { en: 'Pay', pl: 'Wypłata', uk: 'Зарплата', es: 'Sueldo' },
  'Nájem za pokoj': { en: 'Room rent', pl: 'Czynsz za pokój', uk: 'Оренда кімнати', es: 'Alquiler de la habitación' },
  'Nákup jídla': { en: 'Food shopping', pl: 'Zakupy spożywcze', uk: 'Продукти', es: 'Compra de comida' },
  'Jídlo z rozvozu (6×)': { en: 'Food delivery (6×)', pl: 'Jedzenie z dowozem (6×)', uk: 'Доставка їжі (6×)', es: 'Comida a domicilio (6×)' },
  'Drobnosti z e-shopů': { en: 'Little online buys', pl: 'Drobiazgi ze sklepów internetowych', uk: 'Дрібниці з інтернет-магазинів', es: 'Caprichos de tiendas en línea' },
  'Servis kola po pádu': { en: 'Bike repair after a fall', pl: 'Naprawa roweru po wywrotce', uk: 'Ремонт велосипеда після падіння', es: 'Reparar la bici tras una caída' },
  'Lucie, 24 let': { en: 'Lucie, 24', pl: 'Lucie, 24 lata', uk: 'Lucie, 24 роки', es: 'Lucie, 24 años' },
  'Společné bydlení': { en: 'Moving in together', pl: 'Wspólne mieszkanie', uk: 'Спільне житло', es: 'Vivir en pareja' },
  'S přítelem si poprvé pronajali byt. Nájem, energie a nákupy dělí napůl, peníze má každý své.': { en: 'She and her boyfriend have rented their first flat. They split rent, utilities and shopping in half; each keeps their own money.', pl: 'Razem z chłopakiem pierwszy raz wynajęli mieszkanie. Czynsz, media i zakupy dzielą na pół, pieniądze każde ma swoje.', uk: 'Разом із хлопцем вони вперше винайняли квартиру. Оренду, комунальні послуги й покупки ділять навпіл, гроші в кожного свої.', es: 'Ella y su novio han alquilado su primer piso. Pagan a medias el alquiler, los suministros y la compra; cada uno tiene su propio dinero.' },
  'společná dovolená': { en: 'a holiday together', pl: 'wspólne wakacje', uk: 'спільна відпустка', es: 'unas vacaciones juntos' },
  'Polovina nájmu': { en: 'Half the rent', pl: 'Połowa czynszu', uk: 'Половина оренди', es: 'Mitad del alquiler' },
  'Společné nákupy (podíl)': { en: 'Shared shopping (her share)', pl: 'Wspólne zakupy (jej część)', uk: 'Спільні покупки (її частка)', es: 'Compra compartida (su parte)' },
  'Večeře venku (4×)': { en: 'Dinners out (4×)', pl: 'Kolacje na mieście (4×)', uk: 'Вечері поза домом (4×)', es: 'Cenas fuera (4×)' },
  'Předplatné hudby, videa a cloudu': { en: 'Music, video and cloud subscriptions', pl: 'Subskrypcje muzyki, wideo i chmury', uk: 'Підписки на музику, відео й хмару', es: 'Suscripciones de música, vídeo y nube' },
  'Polovina nové lednice': { en: 'Half a new fridge', pl: 'Połowa nowej lodówki', uk: 'Половина нового холодильника', es: 'Mitad de una nevera nueva' },
  'Rozděl příjem': { en: 'Split the income', pl: 'Podziel dochód', uk: 'Розподіли дохід', es: 'Reparte el ingreso' },
  'Na Přehledu rozděl příjem jedním klepnutím. Pak v Plánu rozepiš aspoň jednu část na konkrétní položky, třeba telefon nebo jídlo.': { en: 'On Overview, split the income in one tap. Then in Plan, break at least one part into real items, such as the phone or food.', pl: 'W Przeglądzie podziel dochód jednym stuknięciem. Potem w Planie rozpisz przynajmniej jedną część na konkretne pozycje, na przykład telefon albo jedzenie.', uk: 'В Огляді розподіли дохід одним дотиком. Потім у Плані розпиши хоча б одну частину на конкретні статті, наприклад телефон чи їжу.', es: 'En Resumen, reparte el ingreso con un toque. Luego, en Plan, desglosa al menos una parte en partidas concretas, como el móvil o la comida.' },
  'Otevřít Přehled': { en: 'Open Overview', pl: 'Otwórz Przegląd', uk: 'Відкрити Огляд', es: 'Abrir Resumen' },
  'Najdi únik': { en: 'Find the leak', pl: 'Znajdź przeciek', uk: 'Знайди витік', es: 'Encuentra la fuga' },
  'Projdi, za co už tenhle měsíc šly peníze. Která drobnost se nasčítala nejvíc? Naplánuj na ni v Plánu menší částku, nebo vymysli, čím ji nahradit.': { en: 'Look at what the money has gone on this month. Which small thing added up the most? Plan a smaller amount for it in Plan, or think of something to replace it.', pl: 'Sprawdź, na co w tym miesiącu poszły już pieniądze. Który drobiazg uzbierał się najbardziej? Zaplanuj na niego mniejszą kwotę w Planie albo wymyśl, czym go zastąpić.', uk: 'Переглянь, на що цього місяця вже пішли гроші. Яка дрібниця назбиралася найбільше? Заплануй на неї меншу суму в Плані або придумай, чим її замінити.', es: 'Revisa en qué se ha ido ya el dinero este mes. ¿Qué pequeño gasto se ha acumulado más? Planifica una cantidad menor para él en Plan o piensa con qué sustituirlo.' },
  'Nastav cíl': { en: 'Set a goal', pl: 'Ustal cel', uk: 'Постав ціль', es: 'Fija una meta' },
  'V Cílech přidej cíl, na který se dá šetřit, například {goal}. Za kolik měsíců na něj našetříš s částkou pro Budoucí já?': { en: 'In Goals, add something worth saving for, for example {goal}. How many months will it take with the Future me amount?', pl: 'W Celach dodaj cel, na który można oszczędzać, na przykład {goal}. Ile miesięcy zajmie odłożenie na niego z kwotą dla Przyszłego ja?', uk: 'У Цілях додай ціль, на яку можна відкладати, наприклад {goal}. За скільки місяців ти назбираєш на неї із сумою для «Майбутнього я»?', es: 'En Metas, añade algo para lo que ahorrar, por ejemplo {goal}. ¿Cuántos meses tardarás con la cantidad para Mi yo futuro?' },
  'Otevřít Cíle': { en: 'Open Goals', pl: 'Otwórz Cele', uk: 'Відкрити Цілі', es: 'Abrir Metas' },
  'Nečekaný výdaj': { en: 'An unexpected expense', pl: 'Nieoczekiwany wydatek', uk: 'Несподівана витрата', es: 'Un gasto inesperado' },
  'Přidej ho jako výdaj. Ze které části plánu ho zaplatíš a čemu pak budou peníze chybět?': { en: 'Add it as an expense. Which part of the plan will pay for it, and what will then be short of money?', pl: 'Dodaj go jako wydatek. Z której części planu go pokryjesz i na co potem zabraknie pieniędzy?', uk: 'Додай її як витрату. З якої частини плану ти її оплатиш і на що потім бракуватиме грошей?', es: 'Añádelo como gasto. ¿Con qué parte del plan lo pagarás y para qué faltará luego dinero?' },
  'Ohlédnutí': { en: 'Looking back', pl: 'Spojrzenie wstecz', uk: 'Погляд назад', es: 'Mirar atrás' },
  'V Reflexi odpověz na otázky za postavu z příběhu. Co by šlo příští měsíc udělat jinak? A co si odneseš do vlastního plánu?': { en: 'In Reflection, answer the questions as the person in the story. What could be done differently next month? And what will you take into your own plan?', pl: 'W Refleksji odpowiedz na pytania za postać z historii. Co można by w przyszłym miesiącu zrobić inaczej? I co zabierzesz do własnego planu?', uk: 'У Рефлексії дай відповіді на запитання за персонажа історії. Що можна наступного місяця зробити інакше? І що ти візьмеш у власний план?', es: 'En Reflexión, responde a las preguntas como la persona de la historia. ¿Qué se podría hacer distinto el mes que viene? ¿Y qué te llevas a tu propio plan?' },
  'Otevřít Reflexi': { en: 'Open Reflection', pl: 'Otwórz Refleksję', uk: 'Відкрити Рефлексію', es: 'Abrir Reflexión' },
  'Úvod a výběr příběhu: kdo je postava a s čím vychází.': { en: 'Introduction and choosing a story: who the person is and what they live on.', pl: 'Wstęp i wybór historii: kim jest postać i z czym musi wyżyć.', uk: 'Вступ і вибір історії: хто цей персонаж і на що він живе.', es: 'Introducción y elección de la historia: quién es la persona y con qué vive.' },
  'Rozdělení příjmu 50 / 30 / 20 a první položky plánu.': { en: 'Splitting the income 50 / 30 / 20 and the first plan items.', pl: 'Podział dochodu 50 / 30 / 20 i pierwsze pozycje planu.', uk: 'Розподіл доходу 50 / 30 / 20 і перші статті плану.', es: 'Repartir el ingreso 50 / 30 / 20 y las primeras partidas del plan.' },
  'Hledání úniku: drobné výdaje, které se nasčítají.': { en: 'Finding the leak: small expenses that add up.', pl: 'Szukanie przecieku: drobne wydatki, które się sumują.', uk: 'Пошук витоку: дрібні витрати, що накопичуються.', es: 'Buscar la fuga: pequeños gastos que se acumulan.' },
  'Cíl: kolik a za jak dlouho.': { en: 'A goal: how much and how long.', pl: 'Cel: ile i w jakim czasie.', uk: 'Ціль: скільки й за який час.', es: 'Una meta: cuánto y en cuánto tiempo.' },
  'Nečekaný výdaj: ohlas ho všem najednou, každý příběh má svůj.': { en: 'An unexpected expense: announce it to everyone at once; each story has its own.', pl: 'Nieoczekiwany wydatek: ogłoś go wszystkim naraz, każda historia ma swój.', uk: 'Несподівана витрата: оголоси її всім одночасно, у кожної історії своя.', es: 'Un gasto inesperado: anúncialo a todos a la vez; cada historia tiene el suyo.' },
  'Ohlédnutí ve dvojicích, pak krátce ve skupině.': { en: 'Looking back in pairs, then briefly as a group.', pl: 'Spojrzenie wstecz w parach, potem krótko w grupie.', uk: 'Погляд назад у парах, потім коротко всією групою.', es: 'Mirar atrás en parejas y luego brevemente en grupo.' },
  'Konec: všichni klepnou na Ukončit a smazat.': { en: 'The end: everyone taps End and delete.', pl: 'Koniec: wszyscy stukają Zakończ i usuń.', uk: 'Кінець: усі натискають «Завершити й видалити».', es: 'Final: todos tocan Terminar y borrar.' },
  'Co patří do Potřebného a co už do Radosti?': { en: 'What belongs in Need, and what already in Fun?', pl: 'Co należy do Niezbędnych, a co już do Radości?', uk: 'Що належить до Необхідного, а що вже до Радості?', es: '¿Qué va en Esenciales y qué ya en Alegría?' },
  'Proč posílat peníze Budoucímu já hned na začátku měsíce, a ne až z toho, co zbude?': { en: 'Why send money to Future me right at the start of the month, rather than out of whatever is left?', pl: 'Dlaczego wysyłać pieniądze Przyszłemu ja od razu na początku miesiąca, a nie dopiero z tego, co zostanie?', uk: 'Чому відкладати гроші для «Майбутнього я» одразу на початку місяця, а не з того, що залишиться?', es: '¿Por qué enviar dinero a Mi yo futuro al principio del mes y no de lo que sobre?' },
  'Kolik by ta drobnost stála za rok?': { en: 'What would that small thing cost over a year?', pl: 'Ile ten drobiazg kosztowałby przez rok?', uk: 'Скільки ця дрібниця коштувала б за рік?', es: '¿Cuánto costaría ese pequeño gasto en un año?' },
  'Čím ji nahradit, aby radost zůstala?': { en: 'What could replace it so the fun stays?', pl: 'Czym go zastąpić, żeby radość została?', uk: 'Чим її замінити, щоб радість лишилася?', es: '¿Con qué sustituirlo para que la alegría se quede?' },
  'Co se stane, když cíl nemá částku ani termín?': { en: 'What happens when a goal has neither an amount nor a date?', pl: 'Co się dzieje, gdy cel nie ma ani kwoty, ani terminu?', uk: 'Що стається, коли ціль не має ні суми, ні терміну?', es: '¿Qué pasa cuando una meta no tiene ni cantidad ni fecha?' },
  'Ze které části jste výdaj zaplatili a čemu pak peníze chyběly?': { en: 'Which part paid for the expense, and what was then short of money?', pl: 'Z której części pokryliście wydatek i na co potem zabrakło pieniędzy?', uk: 'З якої частини ви оплатили витрату і на що потім забракло грошей?', es: '¿Con qué parte pagasteis el gasto y para qué faltó luego dinero?' },
  'Jak velká rezerva by na takové překvapení stačila?': { en: 'How big a cushion would cover a surprise like that?', pl: 'Jak duża poduszka wystarczyłaby na taką niespodziankę?', uk: 'Якого розміру резерву вистачило б на такий сюрприз?', es: '¿Qué colchón haría falta para una sorpresa así?' },
  'Co z příběhu platí i pro vás?': { en: 'What in the story is true for you as well?', pl: 'Co z tej historii dotyczy też was?', uk: 'Що з цієї історії стосується й вас?', es: '¿Qué de la historia vale también para vosotros?' },
  // ── batch 2026-11: data you can trust (V-05): password backup, CSV, privacy, home screen ──
  'Soukromí': { en: 'Privacy', pl: 'Prywatność', uk: 'Приватність', es: 'Privacidad' },
  'Jak chráníme tvoje data': { en: 'How we protect your data', pl: 'Jak chronimy twoje dane', uk: 'Як ми захищаємо твої дані', es: 'Cómo protegemos tus datos' },
  'Kde tvoje data jsou a co se nikam neposílá': { en: 'Where your data lives and what is never sent anywhere', pl: 'Gdzie są twoje dane i co nigdzie nie trafia', uk: 'Де твої дані і що нікуди не надсилається', es: 'Dónde están tus datos y qué nunca se envía' },
  'Zálohovat s heslem': { en: 'Back up with a password', pl: 'Zapisz kopię z hasłem', uk: 'Зберегти копію з паролем', es: 'Guardar copia con contraseña' },
  'Zašifrovaná záloha, třeba do e-mailu nebo na sdílený disk': { en: 'An encrypted backup, fine for email or a shared drive', pl: 'Zaszyfrowana kopia, np. do e-maila lub na wspólny dysk', uk: 'Зашифрована копія, напр. для пошти чи спільного диска', es: 'Una copia cifrada, apta para el correo o una unidad compartida' },
  'Výdaje do tabulky': { en: 'Expenses as a spreadsheet', pl: 'Wydatki do tabeli', uk: 'Витрати в таблицю', es: 'Gastos en una hoja de cálculo' },
  'Soubor CSV pro Excel, Numbers nebo LibreOffice': { en: 'A CSV file for Excel, Numbers or LibreOffice', pl: 'Plik CSV do Excela, Numbers lub LibreOffice', uk: 'Файл CSV для Excel, Numbers чи LibreOffice', es: 'Un archivo CSV para Excel, Numbers o LibreOffice' },
  'Zatím tu nejsou žádné výdaje. Až nějaké zapíšeš, půjdou stáhnout jako tabulka.': { en: 'There are no expenses yet. Once you note some down, you can download them as a spreadsheet.', pl: 'Nie ma jeszcze żadnych wydatków. Gdy jakieś zapiszesz, pobierzesz je jako tabelę.', uk: 'Витрат поки немає. Коли запишеш якісь, їх можна буде завантажити як таблицю.', es: 'Todavía no hay gastos. Cuando anotes alguno, podrás descargarlos como hoja de cálculo.' },
  'Tabulka výdajů se stáhla. Otevřeš ji v Excelu, Numbers nebo LibreOffice.': { en: 'The expenses spreadsheet has downloaded. Open it in Excel, Numbers or LibreOffice.', pl: 'Tabela wydatków została pobrana. Otworzysz ją w Excelu, Numbers lub LibreOffice.', uk: 'Таблицю витрат завантажено. Відкрий її в Excel, Numbers чи LibreOffice.', es: 'Se ha descargado la hoja de gastos. Ábrela en Excel, Numbers o LibreOffice.' },
  'Tabulku se nepodařilo vytvořit.': { en: 'The spreadsheet could not be created.', pl: 'Nie udało się utworzyć tabeli.', uk: 'Не вдалося створити таблицю.', es: 'No se pudo crear la hoja de cálculo.' },
  'Název': { en: 'Name', pl: 'Nazwa', uk: 'Назва', es: 'Nombre' },
  'Kategorie': { en: 'Category', pl: 'Kategoria', uk: 'Категорія', es: 'Categoría' },
  'Tento prohlížeč šifrování neumí. Zkus zálohu obnovit v jiném prohlížeči.': { en: 'This browser doesn’t support encryption. Try restoring the backup in another browser.', pl: 'Ta przeglądarka nie obsługuje szyfrowania. Spróbuj przywrócić kopię w innej przeglądarce.', uk: 'Цей браузер не підтримує шифрування. Спробуй відновити резервну копію в іншому браузері.', es: 'Este navegador no admite el cifrado. Prueba a restaurar la copia en otro navegador.' },
  'Skrýt': { en: 'Hide', pl: 'Ukryj', uk: 'Сховати', es: 'Ocultar' },
  'Ukázat': { en: 'Show', pl: 'Pokaż', uk: 'Показати', es: 'Mostrar' },
  'Heslo': { en: 'Password', pl: 'Hasło', uk: 'Пароль', es: 'Contraseña' },
  'Heslo ještě jednou': { en: 'Password again', pl: 'Powtórz hasło', uk: 'Пароль ще раз', es: 'Repite la contraseña' },
  'Heslo musí mít aspoň {n} znaků.': { en: 'The password needs at least {n} characters.', pl: 'Hasło musi mieć co najmniej {n} znaków.', uk: 'Пароль має містити щонайменше {n} символів.', es: 'La contraseña necesita al menos {n} caracteres.' },
  'Hesla se neshodují.': { en: 'The passwords don’t match.', pl: 'Hasła się nie zgadzają.', uk: 'Паролі не збігаються.', es: 'Las contraseñas no coinciden.' },
  'Aspoň {n} znaků. Dobře poslouží věta, kterou si zapamatuješ.': { en: 'At least {n} characters. A sentence you’ll remember works well.', pl: 'Co najmniej {n} znaków. Dobrze sprawdzi się zdanie, które zapamiętasz.', uk: 'Щонайменше {n} символів. Добре підійде речення, яке ти запам’ятаєш.', es: 'Al menos {n} caracteres. Va bien una frase que puedas recordar.' },
  'Záloha s heslem': { en: 'Backup with a password', pl: 'Kopia z hasłem', uk: 'Копія з паролем', es: 'Copia con contraseña' },
  'Zálohu zašifrujeme přímo v tomto prohlížeči. Bez hesla ji nikdo nepřečte, takže může i do e-mailu nebo na sdílený disk.': { en: 'We encrypt the backup right here in this browser. Without the password nobody can read it, so it can go by email or onto a shared drive.', pl: 'Kopię szyfrujemy bezpośrednio w tej przeglądarce. Bez hasła nikt jej nie odczyta, więc może trafić nawet do e-maila lub na wspólny dysk.', uk: 'Копію шифруємо просто в цьому браузері. Без пароля її ніхто не прочитає, тож її можна надіслати поштою чи зберегти на спільному диску.', es: 'Ciframos la copia aquí mismo, en este navegador. Sin la contraseña nadie puede leerla, así que puede ir por correo o a una unidad compartida.' },
  'Tento prohlížeč šifrovat neumí. Použij běžnou zálohu.': { en: 'This browser can’t encrypt. Use the regular backup instead.', pl: 'Ta przeglądarka nie umie szyfrować. Użyj zwykłej kopii.', uk: 'Цей браузер не вміє шифрувати. Скористайся звичайною резервною копією.', es: 'Este navegador no puede cifrar. Usa la copia normal.' },
  'Heslo si zapiš nebo ulož do správce hesel. Když ho zapomeneš, zálohu neotevře nikdo, ani my.': { en: 'Write the password down or keep it in a password manager. If you forget it, nobody can open the backup, not even us.', pl: 'Zapisz hasło albo zachowaj je w menedżerze haseł. Jeśli je zapomnisz, nikt nie otworzy kopii, nawet my.', uk: 'Запиши пароль або збережи його в менеджері паролів. Якщо забудеш його, копію не відкриє ніхто, навіть ми.', es: 'Apunta la contraseña o guárdala en un gestor de contraseñas. Si la olvidas, nadie podrá abrir la copia, ni siquiera nosotros.' },
  'Záloha s heslem se stáhla. Obnovíš ji ve Více → Data → Obnovit ze zálohy.': { en: 'The password backup has downloaded. Restore it under More → Data → Restore from backup.', pl: 'Kopia z hasłem została pobrana. Przywrócisz ją w Więcej → Dane → Przywróć z kopii.', uk: 'Копію з паролем завантажено. Відновиш її в Більше → Дані → Відновити з резервної копії.', es: 'Se ha descargado la copia con contraseña. Restáurala en Más → Datos → Restaurar desde copia.' },
  'Šifruji…': { en: 'Encrypting…', pl: 'Szyfruję…', uk: 'Шифрую…', es: 'Cifrando…' },
  'Stáhnout zálohu s heslem': { en: 'Download the password backup', pl: 'Pobierz kopię z hasłem', uk: 'Завантажити копію з паролем', es: 'Descargar copia con contraseña' },
  'Tahle záloha je zašifrovaná. Zadej heslo, se kterým vznikla. Obnovení nahradí současná data obsahem zálohy.': { en: 'This backup is encrypted. Enter the password it was made with. Restoring replaces the current data with the backup.', pl: 'Ta kopia jest zaszyfrowana. Wpisz hasło, z którym powstała. Przywrócenie zastąpi obecne dane zawartością kopii.', uk: 'Ця копія зашифрована. Введи пароль, з яким її створено. Відновлення замінить поточні дані вмістом копії.', es: 'Esta copia está cifrada. Escribe la contraseña con la que se creó. Al restaurarla, sustituye los datos actuales.' },
  'Heslo k záloze': { en: 'Backup password', pl: 'Hasło do kopii', uk: 'Пароль до копії', es: 'Contraseña de la copia' },
  'Heslo nesedí. Data zůstala beze změny.': { en: 'Wrong password. Your data has not changed.', pl: 'Hasło się nie zgadza. Dane pozostały bez zmian.', uk: 'Пароль не підходить. Дані лишилися без змін.', es: 'La contraseña no es correcta. Los datos no han cambiado.' },
  'Otevírám zálohu…': { en: 'Opening the backup…', pl: 'Otwieram kopię…', uk: 'Відкриваю копію…', es: 'Abriendo la copia…' },
  'Obnovit data': { en: 'Restore data', pl: 'Przywróć dane', uk: 'Відновити дані', es: 'Restaurar datos' },
  'Tvoje čísla zůstávají u tebe. Tady je, kudy vedou.': { en: 'Your numbers stay with you. Here is the path they take.', pl: 'Twoje liczby zostają u ciebie. Oto ich droga.', uk: 'Твої числа лишаються з тобою. Ось їхній шлях.', es: 'Tus números se quedan contigo. Este es el camino que siguen.' },
  'V tomto prohlížeči': { en: 'In this browser', pl: 'W tej przeglądarce', uk: 'У цьому браузері', es: 'En este navegador' },
  'Plán, výdaje, cíle, reflexe a nastavení. Nic z toho se samo nikam neposílá.': { en: 'Plan, expenses, goals, reflections and settings. None of it is sent anywhere on its own.', pl: 'Plan, wydatki, cele, refleksje i ustawienia. Nic z tego samo nigdzie nie trafia.', uk: 'План, витрати, цілі, рефлексії та налаштування. Нічого з цього саме нікуди не надсилається.', es: 'Plan, gastos, metas, reflexiones y ajustes. Nada de ello se envía a ningún sitio por sí solo.' },
  'V souborech, které si uložíš': { en: 'In files you save', pl: 'W plikach, które zapiszesz', uk: 'У файлах, які збережеш', es: 'En los archivos que guardes' },
  'Záloha, záloha s heslem a tabulka výdajů. Vzniknou jen tehdy, když o ně požádáš, a zůstanou tam, kam je uložíš.': { en: 'The backup, the password backup and the expenses spreadsheet. They are made only when you ask, and they stay wherever you save them.', pl: 'Kopia, kopia z hasłem i tabela wydatków. Powstają tylko na twoją prośbę i zostają tam, gdzie je zapiszesz.', uk: 'Резервна копія, копія з паролем і таблиця витрат. Вони з’являються лише на твоє прохання й лишаються там, де ти їх збережеш.', es: 'La copia, la copia con contraseña y la hoja de gastos. Solo se crean cuando lo pides y se quedan donde las guardes.' },
  'Na našem serveru': { en: 'On our server', pl: 'Na naszym serwerze', uk: 'На нашому сервері', es: 'En nuestro servidor' },
  'Nic. Server s daty ani účty nemáme. Hosting aplikaci jen doručí jako každý web; tvoje čísla k němu nedorazí.': { en: 'Nothing. We have no server for data and no accounts. The host only delivers the app, like any website; your numbers never reach it.', pl: 'Nic. Nie mamy serwera z danymi ani kont. Hosting tylko dostarcza aplikację jak każdą stronę; twoje liczby do niego nie trafiają.', uk: 'Нічого. Сервера з даними чи облікових записів у нас немає. Хостинг лише доставляє застосунок, як будь-який сайт; твої числа до нього не потрапляють.', es: 'Nada. No tenemos servidor de datos ni cuentas. El alojamiento solo entrega la app, como cualquier web; tus números nunca llegan a él.' },
  'Dobré vědět': { en: 'Good to know', pl: 'Dobrze wiedzieć', uk: 'Варто знати', es: 'Conviene saber' },
  'PIN': { en: 'PIN', pl: 'PIN', uk: 'PIN', es: 'PIN' },
  'Brání jen náhodnému nahlédnutí na tomto zařízení. Data pod ním šifrovaná nejsou a záloha PIN neobsahuje.': { en: 'It only stops a casual glance on this device. The data behind it is not encrypted, and backups don’t include the PIN.', pl: 'Chroni tylko przed przypadkowym podejrzeniem na tym urządzeniu. Dane pod nim nie są szyfrowane, a kopia nie zawiera PIN-u.', uk: 'Захищає лише від випадкового погляду на цьому пристрої. Дані за ним не шифруються, а резервна копія не містить PIN.', es: 'Solo evita miradas casuales en este dispositivo. Los datos que protege no están cifrados y la copia no incluye el PIN.' },
  'Běžná záloha': { en: 'Regular backup', pl: 'Zwykła kopia', uk: 'Звичайна копія', es: 'Copia normal' },
  'Je to čitelný soubor. Ukládej ho jen tam, kam se cizí nedostanou; do e-mailu nebo na sdílený disk patří záloha s heslem.': { en: 'It is a readable file. Keep it only where strangers can’t get to it; for email or a shared drive, use the password backup.', pl: 'To czytelny plik. Trzymaj go tylko tam, gdzie obcy nie mają dostępu; do e-maila lub na wspólny dysk nadaje się kopia z hasłem.', uk: 'Це файл, який можна прочитати. Зберігай його лише там, куди сторонні не дістануться; для пошти чи спільного диска є копія з паролем.', es: 'Es un archivo legible. Guárdalo solo donde nadie ajeno pueda llegar; para el correo o una unidad compartida, usa la copia con contraseña.' },
  'Šifruje se přímo v prohlížeči (AES-256). Heslo nikde neukládáme, takže bez něj zálohu neotevře nikdo, ani my.': { en: 'It is encrypted right in the browser (AES-256). We don’t store the password anywhere, so without it nobody can open the backup, not even us.', pl: 'Szyfruje się bezpośrednio w przeglądarce (AES-256). Hasła nigdzie nie zapisujemy, więc bez niego nikt nie otworzy kopii, nawet my.', uk: 'Шифрується просто в браузері (AES-256). Пароль ми ніде не зберігаємо, тож без нього копію не відкриє ніхто, навіть ми.', es: 'Se cifra en el propio navegador (AES-256). No guardamos la contraseña en ningún sitio, así que sin ella nadie puede abrir la copia, ni siquiera nosotros.' },
  'Jiné zařízení': { en: 'Another device', pl: 'Inne urządzenie', uk: 'Інший пристрій', es: 'Otro dispositivo' },
  'Data se mezi zařízeními samy nepřenášejí. Udělej zálohu a na druhém zařízení ji obnov.': { en: 'Data doesn’t move between devices by itself. Make a backup and restore it on the other device.', pl: 'Dane same nie przenoszą się między urządzeniami. Zrób kopię i przywróć ją na drugim urządzeniu.', uk: 'Дані самі не переносяться між пристроями. Зроби резервну копію й віднови її на іншому пристрої.', es: 'Los datos no pasan solos de un dispositivo a otro. Haz una copia y restáurala en el otro dispositivo.' },
  'Smazání': { en: 'Deleting', pl: 'Usuwanie', uk: 'Видалення', es: 'Borrado' },
  'Více → Data → Smazat všechna data vymaže vše v tomto prohlížeči. Data zmizí i se smazáním dat webů v nastavení prohlížeče, proto si dělej zálohy.': { en: 'More → Data → Delete all data erases everything in this browser. The data also disappears when you clear website data in your browser settings, so keep backups.', pl: 'Więcej → Dane → Usuń wszystkie dane kasuje wszystko w tej przeglądarce. Dane znikną też po wyczyszczeniu danych witryn w ustawieniach przeglądarki, więc rób kopie.', uk: 'Більше → Дані → Видалити всі дані стирає все в цьому браузері. Дані зникнуть і після очищення даних сайтів у налаштуваннях браузера, тож роби резервні копії.', es: 'Más → Datos → Borrar todos los datos elimina todo en este navegador. Los datos también desaparecen si borras los datos de sitios en los ajustes del navegador, así que haz copias.' },
  'Pracuje s vymyšlenými příběhy uloženými zvlášť. Tvoje vlastní data nečte ani nemění.': { en: 'It uses made-up stories kept separately. It never reads or changes your own data.', pl: 'Działa na zmyślonych historiach zapisanych osobno. Twoich własnych danych nie czyta ani nie zmienia.', uk: 'Працює з вигаданими історіями, збереженими окремо. Твоїх власних даних не читає й не змінює.', es: 'Usa historias inventadas guardadas aparte. No lee ni cambia tus propios datos.' },
  'Kód aplikace je otevřený (licence MIT), takže to může kdokoli ověřit.': { en: 'The app’s code is open (MIT licence), so anyone can check this.', pl: 'Kod aplikacji jest otwarty (licencja MIT), więc każdy może to sprawdzić.', uk: 'Код застосунку відкритий (ліцензія MIT), тож будь-хто може це перевірити.', es: 'El código de la app es abierto (licencia MIT), así que cualquiera puede comprobarlo.' },
  'Na plochu telefonu': { en: 'Add to home screen', pl: 'Na ekran główny', uk: 'На головний екран', es: 'Pantalla de inicio' },
  'Návod': { en: 'Guide', pl: 'Instrukcja', uk: 'Інструкція', es: 'Guía' },
  'Na ploše': { en: 'Installed', pl: 'Zainstalowana', uk: 'Встановлено', es: 'Instalada' },
  'Aplikaci už máš na ploše a právě běží odtud.': { en: 'The app is already on your home screen and running from there.', pl: 'Aplikacja jest już na ekranie głównym i właśnie stamtąd działa.', uk: 'Застосунок уже на головному екрані й зараз працює звідти.', es: 'La app ya está en tu pantalla de inicio y ahora mismo funciona desde ahí.' },
  'Otevře se přes celou obrazovku jako běžná aplikace a funguje i bez připojení.': { en: 'It opens full screen like a regular app and works offline too.', pl: 'Otwiera się na pełnym ekranie jak zwykła aplikacja i działa też bez internetu.', uk: 'Відкривається на весь екран, як звичайний застосунок, і працює навіть без інтернету.', es: 'Se abre a pantalla completa como una app normal y funciona también sin conexión.' },
  'iPhone a iPad': { en: 'iPhone and iPad', pl: 'iPhone i iPad', uk: 'iPhone та iPad', es: 'iPhone y iPad' },
  'Android': { en: 'Android', pl: 'Android', uk: 'Android', es: 'Android' },
  'Další volby': { en: 'More options', pl: 'Więcej opcji', uk: 'Більше опцій', es: 'Más opciones' },
  'Otevři aplikaci v Safari.': { en: 'Open the app in Safari.', pl: 'Otwórz aplikację w Safari.', uk: 'Відкрий застосунок у Safari.', es: 'Abre la app en Safari.' },
  'Klepni na {share} Sdílet. V iOS 26 je pod tlačítkem {more} vedle adresy.': { en: 'Tap {share} Share. In iOS 26 it sits under the {more} button next to the address.', pl: 'Stuknij {share} Udostępnij. W iOS 26 jest pod przyciskiem {more} obok adresu.', uk: 'Торкнися {share} Поширити. В iOS 26 вона під кнопкою {more} поруч з адресою.', es: 'Toca {share} Compartir. En iOS 26 está bajo el botón {more} junto a la dirección.' },
  'Vyber {add} Přidat na plochu, nech zapnuté otevírání jako webové aplikace a klepni na Přidat.': { en: 'Choose {add} Add to Home Screen, leave Open as Web App switched on and tap Add.', pl: 'Wybierz {add} Do ekranu początkowego, zostaw włączone otwieranie jako aplikacji internetowej i stuknij Dodaj.', uk: 'Вибери {add} На початковий екран, залиш увімкненим відкриття як вебпрограми й торкнися Додати.', es: 'Elige {add} Añadir a pantalla de inicio, deja activado abrir como app web y toca Añadir.' },
  'Otevři aplikaci v Chromu.': { en: 'Open the app in Chrome.', pl: 'Otwórz aplikację w Chrome.', uk: 'Відкрий застосунок у Chrome.', es: 'Abre la app en Chrome.' },
  'Klepni na {menu} vedle adresy.': { en: 'Tap {menu} next to the address.', pl: 'Stuknij {menu} obok adresu.', uk: 'Торкнися {menu} поруч з адресою.', es: 'Toca {menu} junto a la dirección.' },
  'Vyber Nainstalovat aplikaci nebo Přidat na plochu a potvrď.': { en: 'Choose Install app or Add to Home screen and confirm.', pl: 'Wybierz Zainstaluj aplikację albo Dodaj do ekranu głównego i potwierdź.', uk: 'Вибери Установити застосунок або Додати на головний екран і підтвердь.', es: 'Elige Instalar aplicación o Añadir a pantalla de inicio y confirma.' },
  'Na iPhonu a iPadu má aplikace na ploše vlastní úložiště, oddělené od Safari. Než ji začneš používat, ulož si v Safari zálohu a v aplikaci na ploše ji obnov (Více → Data).': { en: 'On iPhone and iPad the home-screen app keeps its own storage, separate from Safari. Before you start using it, save a backup in Safari and restore it in the home-screen app (More → Data).', pl: 'Na iPhonie i iPadzie aplikacja na ekranie początkowym ma własną pamięć, oddzieloną od Safari. Zanim zaczniesz z niej korzystać, zapisz kopię w Safari i przywróć ją w aplikacji (Więcej → Dane).', uk: 'На iPhone та iPad застосунок на початковому екрані має власне сховище, окреме від Safari. Перш ніж почнеш ним користуватися, збережи резервну копію в Safari й віднови її в застосунку (Більше → Дані).', es: 'En iPhone y iPad, la app de la pantalla de inicio tiene su propio almacenamiento, separado de Safari. Antes de usarla, guarda una copia en Safari y restáurala en la app (Más → Datos).' },
  'Kdyby v aplikaci na ploše chyběla data, ulož si v prohlížeči zálohu a v aplikaci ji obnov (Více → Data).': { en: 'If the home-screen app is missing your data, save a backup in the browser and restore it in the app (More → Data).', pl: 'Jeśli w aplikacji na ekranie głównym zabraknie danych, zapisz kopię w przeglądarce i przywróć ją w aplikacji (Więcej → Dane).', uk: 'Якщо в застосунку на головному екрані бракуватиме даних, збережи резервну копію в браузері й віднови її в застосунку (Більше → Дані).', es: 'Si a la app de la pantalla de inicio le faltan datos, guarda una copia en el navegador y restáurala en la app (Más → Datos).' },
  // ── batch 2026-11: tips with sources (V-06): facts, sources, today's money, a learning aid ──
  'U věcí nad 1\u00a0000 Kč počkej den. Za den poznáš, jestli je chceš, nebo potřebuješ.': { en: 'For things over 1,000 Kč, wait a day. A day tells you whether you want them or need them.', pl: 'Przy rzeczach powyżej 1\u00a0000 Kč poczekaj dzień. Po dniu poznasz, czy ich chcesz, czy potrzebujesz.', uk: 'Для речей дорожче 1\u00a0000 Kč зачекай день. За день зрозумієш, чи ти їх хочеш, чи вони тобі потрібні.', es: 'Para cosas de más de 1\u00a0000 Kč, espera un día. En un día sabrás si las quieres o las necesitas.' },
  'Než něco koupí, zváží polovina Čechů, jestli si to může dovolit. V roce 2015 to byly tři čtvrtiny.': { en: 'Half of Czechs consider whether they can afford something before they buy it. In 2015 it was three in four.', pl: 'Połowa Czechów przed zakupem zastanawia się, czy ich na to stać. W 2015 roku były to trzy czwarte.', uk: 'Половина чехів перед покупкою зважує, чи може собі її дозволити. У 2015 році це були три чверті.', es: 'La mitad de los checos piensa si puede permitírselo antes de comprar algo. En 2015 eran tres de cada cuatro.' },
  'Na autopilota': { en: 'On autopilot', pl: 'Na autopilocie', uk: 'На автопілоті', es: 'En piloto automático' },
  'Trvalý příkaz si nastavuje 70\u00a0% domácností. Nastav ho na den výplaty a budoucí já dostane své jako první.': { en: '70\u00a0% of households use standing orders. Set one for payday and your future self gets paid first.', pl: '70\u00a0% gospodarstw domowych ustawia zlecenia stałe. Ustaw je na dzień wypłaty, a przyszły ja dostanie swoje jako pierwszy.', uk: '70\u00a0% домогосподарств налаштовують постійні платіжні доручення. Признач одне на день зарплати, і майбутній я отримає своє першим.', es: 'El 70\u00a0% de los hogares usa órdenes permanentes. Programa una para el día de cobro y tu yo futuro cobrará primero.' },
  'Na drobné radosti pamatuj v plánu. Když na ně máš vyhrazeno, užiješ si je bez výčitek.': { en: 'Make room for small joys in your plan. When they have money set aside, you can enjoy them without guilt.', pl: 'Zrób w planie miejsce na drobne przyjemności. Gdy masz na nie odłożone, nacieszysz się nimi bez wyrzutów sumienia.', uk: 'Залиш у плані місце для дрібних радощів. Коли на них є відкладене, насолодишся ними без докорів сумління.', es: 'Deja sitio en tu plan para pequeños placeres. Si tienen su dinero apartado, los disfrutarás sin culpa.' },
  'Radost z koupeného zážitku časem spíš roste, radost z nové věci rychle vyprchá.': { en: 'Joy from a bought experience tends to grow over time; joy from a new thing fades quickly.', pl: 'Radość z kupionego przeżycia z czasem raczej rośnie, radość z nowej rzeczy szybko mija.', uk: 'Радість від купленого враження з часом радше зростає, а радість від нової речі швидко минає.', es: 'La alegría de una experiencia comprada suele crecer con el tiempo; la de una cosa nueva se esfuma pronto.' },
  'Dej spoření jméno a částku, třeba „Toskánsko, 30\u00a0000 Kč“. S jasným cílem víš, proč odkládáš.': { en: 'Give your savings a name and an amount, like “Tuscany, 30,000 Kč”. With a clear goal you know why you are setting money aside.', pl: 'Nadaj oszczędnościom nazwę i kwotę, np. „Toskania, 30\u00a0000 Kč”. Z jasnym celem wiesz, po co odkładasz.', uk: 'Дай заощадженням назву й суму, наприклад «Тоскана, 30\u00a0000 Kč». З чіткою ціллю знаєш, навіщо відкладаєш.', es: 'Ponle a tu ahorro un nombre y una cantidad, como «Toscana, 30\u00a0000 Kč». Con una meta clara sabes por qué apartas dinero.' },
  'Finanční cíl si stanovuje 41\u00a0% Čechů. Z nich 69\u00a0% kvůli němu začalo spořit a 64\u00a0% si udělalo plán.': { en: '41\u00a0% of Czechs set themselves a financial goal. Of those, 69\u00a0% started saving for it and 64\u00a0% made a plan.', pl: '41\u00a0% Czechów wyznacza sobie cel finansowy. Spośród nich 69\u00a0% zaczęło na niego oszczędzać, a 64\u00a0% zrobiło plan.', uk: '41\u00a0% чехів ставлять собі фінансову ціль. З них 69\u00a0% почали на неї заощаджувати, а 64\u00a0% склали план.', es: 'El 41\u00a0% de los checos se fija una meta financiera. De ellos, el 69\u00a0% empezó a ahorrar para ella y el 64\u00a0% hizo un plan.' },
  'Tvoje dnešní radost. Kavárny, výlety, koníčky a drobnosti, co ti dělají život hezčí. Když má radost v plánu své místo, víš, kolik si na ni můžeš dovolit.': { en: 'Your joy today: cafés, trips, hobbies and little things that make life nicer. When joy has its place in the plan, you know how much you can spend on it.', pl: 'Twoja dzisiejsza radość: kawiarnie, wycieczki, hobby i drobiazgi, które umilają życie. Gdy radość ma swoje miejsce w planie, wiesz, ile możesz na nią wydać.', uk: 'Твоя сьогоднішня радість: кав’ярні, поїздки, хобі й дрібнички, що роблять життя приємнішим. Коли радість має місце в плані, ти знаєш, скільки можеш на неї витратити.', es: 'Tu alegría de hoy: cafés, viajes, aficiones y detalles que hacen la vida más bonita. Cuando la alegría tiene su sitio en el plan, sabes cuánto puedes gastar en ella.' },
  'Složené úročení znamená, že výnosy samy vydělávají další výnosy. Americký index S&P\u00a0500 vynesl s reinvesticí dividend v letech 1928–2025 průměrně asi 10\u00a0% ročně, před započtením inflace. Graf je zjednodušená ilustrace: minulé výnosy nezaručují budoucí a nejde o investiční doporučení.': { en: 'Compounding means returns earn further returns. With dividends reinvested, the US S&P\u00a0500 index returned about 10\u00a0% a year on average from 1928 to 2025, before inflation. The chart is a simplified illustration: past returns do not guarantee future ones, and this is not investment advice.', pl: 'Procent składany oznacza, że zyski same zarabiają kolejne zyski. Amerykański indeks S&P\u00a0500 przy reinwestycji dywidend dawał w latach 1928–2025 średnio ok. 10\u00a0% rocznie, przed uwzględnieniem inflacji. Wykres to uproszczona ilustracja: przeszłe zyski nie gwarantują przyszłych i nie jest to rekomendacja inwestycyjna.', uk: 'Складний відсоток означає, що дохід сам заробляє новий дохід. Американський індекс S&P\u00a0500 з реінвестуванням дивідендів у 1928–2025 роках давав у середньому близько 10\u00a0% на рік, без урахування інфляції. Графік — спрощена ілюстрація: минулі прибутки не гарантують майбутніх, і це не інвестиційна порада.', es: 'El interés compuesto significa que las ganancias generan más ganancias. Reinvirtiendo dividendos, el índice estadounidense S&P\u00a0500 rindió de media un 10\u00a0% anual entre 1928 y 2025, antes de la inflación. El gráfico es una ilustración simplificada: las rentabilidades pasadas no garantizan las futuras y no es una recomendación de inversión.' },
  'Ukázat v dnešních penězích': { en: 'Show in today’s money', pl: 'Pokaż w dzisiejszych pieniądzach', uk: 'Показати в сьогоднішніх грошах', es: 'Mostrar en dinero de hoy' },
  'Počítá s inflací 2\u00a0% ročně.': { en: 'Assumes 2\u00a0% inflation a year.', pl: 'Zakłada inflację 2\u00a0% rocznie.', uk: 'Враховує інфляцію 2\u00a0% на рік.', es: 'Supone una inflación del 2\u00a0% anual.' },
  'v dnešních penězích': { en: 'in today’s money', pl: 'w dzisiejszych pieniądzach', uk: 'у сьогоднішніх грошах', es: 'en dinero de hoy' },
  'Inflace 2\u00a0% ročně odpovídá cíli České národní banky. Skutečná inflace kolísá: v roce 2022 byla 15,1\u00a0%.': { en: 'Inflation of 2\u00a0% a year is the Czech National Bank’s target. Actual inflation varies: in 2022 it was 15.1\u00a0%.', pl: 'Inflacja 2\u00a0% rocznie to cel Czeskiego Banku Narodowego. Rzeczywista inflacja się waha: w 2022 roku wyniosła 15,1\u00a0%.', uk: 'Інфляція 2\u00a0% на рік — це ціль Чеського національного банку. Справжня інфляція коливається: у 2022 році вона становила 15,1\u00a0%.', es: 'Una inflación del 2\u00a0% anual es el objetivo del Banco Nacional Checo. La inflación real varía: en 2022 fue del 15,1\u00a0%.' },
  'Zdroj': { en: 'Source', pl: 'Źródło', uk: 'Джерело', es: 'Fuente' },
  'Zdroje': { en: 'Sources', pl: 'Źródła', uk: 'Джерела', es: 'Fuentes' },
  'ověřeno {d}': { en: 'checked {d}', pl: 'sprawdzono {d}', uk: 'перевірено {d}', es: 'comprobado el {d}' },
  'otevře se v nové kartě': { en: 'opens in a new tab', pl: 'otwiera się w nowej karcie', uk: 'відкриється в новій вкладці', es: 'se abre en una pestaña nueva' },
  'Vědomé utrácení je vzdělávací pomůcka, ne finanční poradenství.': { en: 'Mindful Spending is a learning aid, not financial advice.', pl: 'Świadome wydawanie to pomoc w nauce, a nie doradztwo finansowe.', uk: 'Усвідомлені витрати — навчальний інструмент, а не фінансова консультація.', es: 'Gasto Consciente es una herramienta para aprender, no asesoramiento financiero.' },
  'U každého tipu je zdroj a den, kdy jsme ho naposledy ověřili.': { en: 'Every tip names its source and the day we last checked it.', pl: 'Przy każdej poradzie jest źródło i dzień, w którym ostatnio je sprawdziliśmy.', uk: 'Біля кожної поради є джерело й день, коли ми востаннє його перевірили.', es: 'Cada consejo indica su fuente y el día en que la comprobamos por última vez.' },
};

// Keys are matched exactly first, then with spaces and quotation marks normalised
// (NBSP vs space, „“” vs ") so a component string always finds its entry.
function faNormKey(s) { return String(s).replace(/\u00a0/g, ' ').replace(/[\u201e\u201c\u201d]/g, '"'); }
const SN = {};
for (const k in S) { const n = faNormKey(k); if (!(n in SN)) SN[n] = S[k]; }
function L(cs) {
  if (FA_LANG === 'cs') return cs;
  const e = S[cs] || SN[faNormKey(cs)];
  return (e && e[FA_LANG]) || cs;
}
function Lf(cs, vars) {
  let s = L(cs);
  for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}

// Default names that end up in the user's data (the seeded main income, goal
// presets, plan and expense suggestions) may have been stored in whichever
// language was active at the time. Modules register those Czech keys, and
// faDataLabel() maps a stored name in any language back to its key, so the
// name always shows in the interface language. Names the user typed are shown
// as typed (through L, as before).
const FA_DATA_NAMES = new Set();
let FA_DATA_REV = null;
function faRegisterDataNames(keys) { keys.forEach(k => FA_DATA_NAMES.add(k)); FA_DATA_REV = null; }
function faDataLabel(name) {
  if (name == null) return '';
  if (!FA_DATA_REV) {
    FA_DATA_REV = {};
    FA_DATA_NAMES.forEach(k => {
      FA_DATA_REV[k] = k;
      const e = S[k] || SN[faNormKey(k)];
      if (e) for (const lang in e) FA_DATA_REV[e[lang]] = k;
    });
  }
  const s = String(name);
  return L(FA_DATA_REV[s.trim()] || s);
}

Object.assign(window, { FA_LANGS, FA_LANG_DEFAULT, setFaLang, getFaLang, getFaLocale, loadFaLang, saveFaLang, L, Lf, faRegisterDataNames, faDataLabel });
