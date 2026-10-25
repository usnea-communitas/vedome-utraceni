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

// stored choice ('fa.lang'), otherwise English
function loadFaLang() {
  try {
    const raw = localStorage.getItem(FA_LANG_KEY);
    const code = raw == null ? null : String(raw).replace(/^"|"$/g, '');
    return faIsLang(code) ? code : FA_LANG_DEFAULT;
  } catch (e) { return FA_LANG_DEFAULT; }
}
function saveFaLang(c) {
  try { if (faIsLang(c)) localStorage.setItem(FA_LANG_KEY, c); } catch (e) {}
}

let FA_LANG = loadFaLang();
function setFaLang(c) { FA_LANG = faIsLang(c) ? c : FA_LANG_DEFAULT; }
function getFaLang() { return FA_LANG; }
// BCP-47 tag for Intl formatting and <html lang> — the language codes double as locales
function getFaLocale() { return FA_LANG; }

// dictionary: "czech source" → { en, pl, uk, es }
const S = {
  // ── onboarding + real-data mode ──
  'Vítej ve vědomém utrácení': { en: 'Welcome to conscious spending', pl: 'Witaj w świadomym wydawaniu', uk: 'Ласкаво просимо до свідомих витрат', es: 'Te damos la bienvenida al gasto consciente' },
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
  'Osvědčený základ je 50 / 30 / 20 — uprav si ho podle sebe.': { en: 'The proven base is 50 / 30 / 20 — adjust it to fit you.', pl: 'Sprawdzona baza to 50 / 30 / 20 — dopasuj ją do siebie.', uk: 'Перевірена основа — 50 / 30 / 20; налаштуй її під себе.', es: 'La base probada es 50 / 30 / 20: ajústala a tu medida.' },
  'Vyvážená 50/30/20': { en: 'Balanced 50/30/20', pl: 'Zrównoważony 50/30/20', uk: 'Збалансований 50/30/20', es: 'Equilibrado 50/30/20' },
  'Úsporné': { en: 'Frugal', pl: 'Oszczędny', uk: 'Ощадливий', es: 'Ahorrador' },
  'Volnější': { en: 'Relaxed', pl: 'Swobodniejszy', uk: 'Вільніший', es: 'Más holgado' },
  'Krásně vyvážené — dohromady 100 %.': { en: 'Beautifully balanced — 100 % total.', pl: 'Pięknie zrównoważone — razem 100 %.', uk: 'Чудово збалансовано — разом 100 %.', es: 'Muy equilibrado: 100 % en total.' },
  'Dohromady {v} % — uprav na 100 %.': { en: '{v} % total — adjust to 100 %.', pl: 'Razem {v} % — dopasuj do 100 %.', uk: 'Разом {v} % — доведи до 100 %.', es: '{v} % en total: ajusta hasta el 100 %.' },
  'Tvůj první cíl': { en: 'Your first goal', pl: 'Twój pierwszy cel', uk: 'Твоя перша ціль', es: 'Tu primera meta' },
  'Pojmenovaný cíl se plní snáz. Vyber, na co šetříš — nebo přeskoč a přidej později.': { en: 'A named goal is easier to reach. Pick what you are saving for — or skip and add it later.', pl: 'Nazwany cel łatwiej osiągnąć. Wybierz, na co oszczędzasz — albo pomiń i dodaj później.', uk: 'Названу ціль легше досягти. Обери, на що відкладаєш, — або пропусти й додай пізніше.', es: 'Una meta con nombre se cumple más fácil. Elige para qué ahorras, o sáltalo y añádela después.' },
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
  'v limitu': { en: 'within limit', pl: 'w limicie', uk: 'у межах', es: 'dentro del límite' },
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
  'Opakuje se měsíčně': { en: 'Repeats monthly', pl: 'Powtarza się co miesiąc', uk: 'Повторюється щомісяця', es: 'Se repite cada mes' },
  'Návrhy': { en: 'Suggestions', pl: 'Propozycje', uk: 'Пропозиції', es: 'Sugerencias' },
  'Co rozdělit': { en: 'What to split', pl: 'Co podzielić', uk: 'Що розподілити', es: 'Qué repartir' },
  'cíl': { en: 'target', pl: 'cel', uk: 'ціль', es: 'meta' },
  'cíl {p} %': { en: 'target {p} %', pl: 'cel {p} %', uk: 'ціль {p} %', es: 'meta {p} %' },
  'Přidat': { en: 'Add', pl: 'Dodaj', uk: 'Додати', es: 'Añadir' },
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
  'Zpět': { en: 'Undo', pl: 'Cofnij', uk: 'Скасувати', es: 'Deshacer' },
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
  // reflexe quiz
  'Odpověz na pár otázek a podívej se, jak ti tento měsíc bylo s penězi.': { en: 'Answer a few questions and see how money felt this month.', pl: 'Odpowiedz na kilka pytań i zobacz, jak było ci z pieniędzmi w tym miesiącu.', uk: 'Дай відповідь на кілька запитань і подивись, як тобі цього місяця велося з грошима.', es: 'Responde unas preguntas y mira cómo te fue con el dinero este mes.' },
  'Přehled minulého měsíce': { en: 'Last month review', pl: 'Podsumowanie miesiąca', uk: 'Огляд минулого місяця', es: 'Resumen del mes' },
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
  'Zkus jedinou změnu: hned po výplatě odlož 10 % stranou, než cokoli utratíš. Malý automatický krok ti vrátí pocit kontroly — a příští reflexe bude lehčí.': { en: 'Try one change: right after payday set aside 10% before spending anything. A small automatic step brings back a sense of control — and next reflection will feel lighter.', pl: 'Spróbuj jednej zmiany: zaraz po wypłacie odłóż 10% przed wydawaniem. Mały automatyczny krok przywróci poczucie kontroli — a kolejna refleksja będzie lżejsza.', uk: 'Спробуй одну зміну: одразу після зарплати відклади 10%, перш ніж щось витрачати. Маленький автоматичний крок поверне відчуття контролю — і наступна рефлексія буде легшою.', es: 'Prueba un cambio: justo tras cobrar aparta el 10% antes de gastar. Un pequeño paso automático te devuelve el control — y la próxima reflexión será más ligera.' },
  'Máš pevný základ. Tento měsíc zkus pojmenovat jeden konkrétní cíl a posílat na něj pravidelnou částku. Z rovnováhy se tak pomalu stane radost.': { en: 'You have a solid base. This month, name one concrete goal and send it a regular amount. Balance will slowly turn into joy.', pl: 'Masz solidną podstawę. W tym miesiącu nazwij jeden konkretny cel i wysyłaj na niego regularną kwotę. Równowaga powoli zmieni się w radość.', uk: 'У тебе міцна основа. Цього місяця назви одну конкретну ціль і надсилай на неї регулярну суму. Рівновага поступово стане радістю.', es: 'Tienes una base sólida. Este mes, nombra una meta concreta y envíale una cantidad regular. El equilibrio se volverá alegría poco a poco.' },
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
  'Zapnuto': { en: 'On', pl: 'Włączone', uk: 'Увімкнено', es: 'Activado' },
  'Vzhled': { en: 'Appearance', pl: 'Wygląd', uk: 'Вигляд', es: 'Apariencia' },
  'Jazyk': { en: 'Language', pl: 'Język', uk: 'Мова', es: 'Idioma' },
  'Lesní klid': { en: 'Forest Calm', pl: 'Leśny spokój', uk: 'Лісовий спокій', es: 'Calma del bosque' },
  'Kouzelnický': { en: 'Wizardly', pl: 'Czarodziejski', uk: 'Чарівний', es: 'Mágico' },
  'verze 1.0': { en: 'version 1.0', pl: 'wersja 1.0', uk: 'версія 1.0', es: 'versión 1.0' },
  // ── batch 2026-09: months, dates, backup, reminders, neutral wording ──
  'Datum': { en: 'Date', pl: 'Data', uk: 'Дата', es: 'Fecha' },
  'Celkem za {m}: {v}': { en: 'Total for {m}: {v}', pl: 'Razem za {m}: {v}', uk: 'Разом за {m}: {v}', es: 'Total de {m}: {v}' },
  'z toho plán {a} a jednorázové výdaje {b}': { en: 'of which plan {a} and one-off expenses {b}', pl: 'w tym plan {a} i wydatki jednorazowe {b}', uk: 'з них план {a} і разові витрати {b}', es: 'de ello plan {a} y gastos puntuales {b}' },
  'Další krok: v Plánu rozepiš, co patří do Potřebných — nájem, energie, jídlo.': { en: 'Next step: in Plan, list what belongs to Essentials — rent, energy, food.', pl: 'Następny krok: w Planie rozpisz, co należy do Niezbędnych — czynsz, energia, jedzenie.', uk: 'Наступний крок: у Плані розпиши, що належить до Необхідного — оренда, енергія, їжа.', es: 'Siguiente paso: en el Plan detalla lo que va a Necesario — alquiler, energía, comida.' },
  'Rozepsat měsíční plán': { en: 'Break down the monthly plan', pl: 'Rozpisz plan miesięczny', uk: 'Розписати місячний план', es: 'Detallar el plan mensual' },
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
  'Překročeno o 210 Kč.': { en: 'Over by 210 CZK.', pl: 'Przekroczono o 210 Kč.', uk: 'Перевищено на 210 Kč.', es: 'Superado en 210 Kč.' },
  'Pod cílem o 140 Kč.': { en: 'Under target by 140 CZK.', pl: 'Poniżej celu o 140 Kč.', uk: 'Нижче цілі на 140 Kč.', es: 'Por debajo del objetivo en 140 Kč.' },
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
