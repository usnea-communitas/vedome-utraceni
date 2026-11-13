// fa-workshop.jsx — the workshop mode. A facilitator shares a link or a QR code
// (?workshop=1&lang=cs); each participant picks one of three made-up stories
// and works through five short tasks in the ordinary app. The workshop keeps
// its own data (fa-storage.jsx), so a participant's own plan in the same
// browser is never read or changed, and "End and delete" removes the
// workshop's data and nothing else.

const { useState: useW } = React;

// The workshop link; the QR codes in assets/ encode the same addresses
// (scripts/workshop-qr.mjs).
const FA_SITE = 'https://vedome-utraceni.vercel.app';
function faWorkshopLink(lang) { return FA_SITE + '/?workshop=1&lang=' + lang; }
// the demo: the workshop on its first story, in the language chosen on the welcome screen
function faDemoLink(lang) { return '?workshop=1&demo=1&lang=' + (lang || 'en'); }

// Three made-up stories of young people; the amounts are illustrative. Names
// that end up in the data are Czech keys (registered below), so they follow
// the interface language.
const FA_WORKSHOP_STORIES = [
  {
    id: 'ema', who: 'Ema, 19 let', name: 'Ema', title: 'Studentka s brigádou', icon: 'blossom', accent: 'blush',
    situation: 'Studuje první ročník a o víkendech pracuje v kavárně. Bydlí u rodičů, takže nájem ani jídlo doma neplatí. Telefon, dojíždění a zábavu ano.',
    income: [{ name: 'Brigáda v kavárně', amount: 9600 }, { name: 'Kapesné od rodičů', amount: 2000 }],
    spent: [
      { name: 'Telefon', amount: 399, cat: 'nutne' },
      { name: 'Jízdenka na měsíc', amount: 300, cat: 'nutne' },
      { name: 'Káva cestou do školy (12×)', amount: 780, cat: 'radost' },
      { name: 'Tři streamovací služby', amount: 597, cat: 'radost' },
    ],
    goal: 'řidičák',
    surprise: { name: 'Prasklý displej telefonu', amount: 2490, cat: 'nutne' },
  },
  {
    id: 'tomas', who: 'Tomáš, 20 let', name: 'Tomáš', title: 'První výplata', icon: 'sun', accent: 'honey',
    situation: 'Po maturitě nastoupil do první práce. Bydlí v pronajatém pokoji a poprvé platí všechno sám.',
    income: [{ name: 'Výplata', amount: 27500 }],
    spent: [
      { name: 'Nájem za pokoj', amount: 9500, cat: 'nutne' },
      { name: 'Nákup jídla', amount: 2400, cat: 'nutne' },
      { name: 'Jídlo z rozvozu (6×)', amount: 1740, cat: 'radost' },
      { name: 'Drobnosti z e-shopů', amount: 1150, cat: 'radost' },
    ],
    goal: 'rezerva na tři měsíce',
    surprise: { name: 'Servis kola po pádu', amount: 1800, cat: 'nutne' },
  },
  {
    id: 'lucie', who: 'Lucie, 24 let', name: 'Lucie', title: 'Společné bydlení', icon: 'castle', accent: 'sage',
    situation: 'S přítelem si poprvé pronajali byt. Nájem, energie a nákupy dělí napůl, peníze má každý své.',
    income: [{ name: 'Výplata', amount: 32000 }],
    spent: [
      { name: 'Polovina nájmu', amount: 8500, cat: 'nutne' },
      { name: 'Společné nákupy (podíl)', amount: 3200, cat: 'nutne' },
      { name: 'Večeře venku (4×)', amount: 1800, cat: 'radost' },
      { name: 'Předplatné hudby, videa a cloudu', amount: 657, cat: 'radost' },
    ],
    goal: 'společná dovolená',
    surprise: { name: 'Polovina nové lednice', amount: 4500, cat: 'nutne' },
  },
];
faRegisterDataNames(FA_WORKSHOP_STORIES.flatMap(s => s.income.concat(s.spent, [s.surprise]).map(x => x.name)));

// The five tasks, in the order of the lesson. `go` opens a screen; `add` opens
// the new-expense sheet with the story's unexpected expense filled in.
const FA_WORKSHOP_TASKS = [
  { key: 'split', title: 'Rozděl příjem', go: 'prehled', action: 'Otevřít Přehled',
    body: 'Na Přehledu rozděl příjem jedním klepnutím. Pak v Plánu rozepiš aspoň jednu část na konkrétní položky, třeba telefon nebo jídlo.' },
  { key: 'leak', title: 'Najdi únik', go: 'prehled', action: 'Otevřít Přehled',
    body: 'Projdi, za co už tenhle měsíc šly peníze. Která drobnost se nasčítala nejvíc? Naplánuj na ni v Plánu menší částku, nebo vymysli, čím ji nahradit.' },
  { key: 'goal', title: 'Nastav cíl', go: 'cile', action: 'Otevřít Cíle',
    body: 'V Cílech přidej cíl, na který se dá šetřit, například {goal}. Za kolik měsíců na něj našetříš s částkou pro Budoucí já?' },
  { key: 'surprise', title: 'Nečekaný výdaj', add: true, action: 'Přidat výdaj',
    body: 'Přidej ho jako výdaj. Ze které části plánu ho zaplatíš a čemu pak budou peníze chybět?' },
  { key: 'look', title: 'Ohlédnutí', go: 'reflexe', action: 'Otevřít Reflexi',
    body: 'V Reflexi odpověz na otázky za postavu z příběhu. Co by šlo příští měsíc udělat jinak? A co si odneseš do vlastního plánu?' },
];

// for the facilitator: about 45 minutes, and questions for each task
const FA_WORKSHOP_TIMING = [
  [5, 'Úvod a výběr příběhu: kdo je postava a s čím vychází.'],
  [8, 'Rozdělení příjmu 50 / 30 / 20 a první položky plánu.'],
  [8, 'Hledání úniku: drobné výdaje, které se nasčítají.'],
  [7, 'Cíl: kolik a za jak dlouho.'],
  [7, 'Nečekaný výdaj: ohlas ho všem najednou, každý příběh má svůj.'],
  [7, 'Ohlédnutí ve dvojicích, pak krátce ve skupině.'],
  [3, 'Konec: všichni klepnou na Ukončit a smazat.'],
];
const FA_WORKSHOP_QUESTIONS = {
  split: ['Co patří do Potřebného a co už do Radosti?', 'Proč posílat peníze Budoucímu já hned na začátku měsíce, a ne až z toho, co zbude?'],
  leak: ['Kolik by ta drobnost stála za rok?', 'Čím ji nahradit, aby radost zůstala?'],
  goal: ['Co se stane, když cíl nemá částku ani termín?'],
  surprise: ['Ze které části jste výdaj zaplatili a čemu pak peníze chyběly?', 'Jak velká rezerva by na takové překvapení stačila?'],
  look: ['Co z příběhu platí i pro vás?'],
};

// The facilitator kit (docs/workshop/, made by scripts/workshop-pdf.mjs): Czech
// and English; the other languages get the English one.
const FA_WORKSHOP_KIT = {
  cs: [['Průvodce lekcí', 'vedome-utraceni-pro-lektory-cs.pdf'], ['Pracovní listy a dotazník', 'vedome-utraceni-pracovni-listy-cs.pdf'], ['Snímky', 'vedome-utraceni-snimky-cs.pdf']],
  en: [['Průvodce lekcí', 'mindful-spending-facilitator-guide-en.pdf'], ['Pracovní listy a dotazník', 'mindful-spending-worksheets-en.pdf'], ['Snímky', 'mindful-spending-slides-en.pdf']],
};
function faWorkshopKit(lang) {
  return (FA_WORKSHOP_KIT[lang] || FA_WORKSHOP_KIT.en).map(([label, file]) => ({ label, href: 'docs/workshop/pdf/' + file }));
}

function faWorkshopStory(id) { return FA_WORKSHOP_STORIES.find(s => s.id === id) || null; }
const faStoryIncome = story => story.income.reduce((s, x) => s + x.amount, 0);

// ticked tasks: a list of task keys
function loadFaTasks() {
  const keys = FA_WORKSHOP_TASKS.map(t => t.key);
  const v = faLoad('fa.tasks', []);
  return Array.isArray(v) ? v.filter(k => keys.includes(k)) : [];
}
function saveFaTasks(list) { faSave('fa.tasks', list); }

// Seeds the workshop's own data with a story: the month's income (no plan
// items yet, the first task splits it), what was already spent this month,
// 50 / 30 / 20 and no goal. Never writes outside a workshop.
function faStartWorkshop(id) {
  const story = faWorkshopStory(id);
  if (!FA_IN_WORKSHOP || !story) return false;
  const month = faCurrentMonth();
  const today = new Date().getDate();
  const base = Date.now();
  saveFaProfile({ name: story.name, income: faStoryIncome(story), created: base, workshop: story.id });
  faSave('fa.plans', { [month]: {
    income: story.income.map(x => ({ name: x.name, amount: x.amount, recurring: true })),
    items: { nutne: [], budouci: [], radost: [] },
  } });
  // spread over the days of the month so far
  faSave('fa.expenses', story.spent.map((e, i) => ({
    name: e.name, amount: e.amount, cat: e.cat, ts: base + i,
    day: month + '-' + faPad2(Math.max(1, Math.round(today * (i + 1) / story.spent.length))),
  })));
  faSave('fa.deposits', []);
  faSave('fa.goals', []);
  faSave('fa.reflexe', {});
  faSave('fa.ratios', { nutne: 50, budouci: 20, radost: 30 });
  saveFaTasks([]);
  return true;
}

// ── before a story is chosen: what the workshop is, and the three stories ──
function WorkshopWelcome({ lang, setLang, onStart }) {
  const [pick, setPick] = useW(null);
  const [guide, setGuide] = useW(false);
  const story = faWorkshopStory(pick);
  if (guide) {
    return (
      <main className="fa-onb">
        <div className="fa-onb-card">
          <WorkshopGuide inCard onBack={() => setGuide(false)} />
        </div>
      </main>
    );
  }
  return (
    <main className="fa-onb">
      <div className="fa-onb-card">
        <div className="fa-ws-mark"><Icon name="tasks" size={36} stroke={1.5} /></div>
        <h1 className="fa-onb-h" style={{ textAlign: 'center' }}>{L('Workshop Vědomého utrácení')}</h1>
        <p className="fa-onb-p">{L('Vyber si příběh a projdi s ním pět krátkých úkolů. Postava i peníze jsou smyšlené, tak klidně zkoušej, co tě napadne.')}</p>
        <p className="fa-onb-p">{L('Všechno zůstane jen v tomhle prohlížeči, odděleně od tvých vlastních dat, a na konci to jedním tlačítkem smažeš.')}</p>
        <div className="fa-lang fa-onb-lang" role="group" aria-label={L('Jazyk')} style={{ marginBottom: 18 }}>
          {FA_LANGS.map(l => (
            <button key={l.code} lang={l.code} data-on={lang === l.code} aria-pressed={lang === l.code} onClick={() => setLang(l.code)}>{l.name}</button>
          ))}
        </div>
        <h2 className="fa-ws-label">{L('Vyber příběh')}</h2>
        <div className="fa-ws-stories">
          {FA_WORKSHOP_STORIES.map(s => {
            const on = pick === s.id;
            return (
              <button key={s.id} className="fa-onb-goal" data-on={on} aria-pressed={on} onClick={() => setPick(s.id)}>
                <span className="fa-onb-goal-ico" style={{ background: accentSoft(s.accent), color: accentVar(s.accent) }}>
                  <Icon name={s.icon} size={19} stroke={1.7} />
                </span>
                <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <span className="fa-ws-who">{L(s.who)}</span>
                  <span className="fa-ws-sub">{L(s.title)} · {kc(faStoryIncome(s))}</span>
                </span>
                {on && <Icon name="check" size={16} stroke={2.2} color={accentVar(s.accent)} />}
              </button>
            );
          })}
        </div>
        {story && <p className="fa-ws-situation" aria-live="polite">{L(story.situation)}</p>}
        <button className="fa-cta fa-cta-solid" style={{ marginTop: 16 }} disabled={!story} onClick={() => story && onStart(story.id)}>
          {L('Začít s příběhem')} <Icon name="chevron" size={16} stroke={2} />
        </button>
        <button className="fa-textbtn" style={{ marginTop: 12, alignSelf: 'center' }} onClick={() => setGuide(true)}>{L('Pro lektora')}</button>
      </div>
    </main>
  );
}

// ── the demo: made-up data, and the way back to the participant's own app ──
function DemoBar({ onEnd }) {
  return (
    <div className="fa-demo">
      <p className="fa-demo-text"><strong>{L('Ukázka')}</strong> {L('Data jsou smyšlená a zůstávají odděleně od tvých.')}</p>
      <button type="button" className="fa-ghostbtn fa-demo-end" onClick={onEnd}>{L('Ukončit ukázku')}</button>
    </div>
  );
}

// ── the Workshop tab: the story, the five tasks, the end ──
function Workshop({ go, profile, onAdd, endWorkshop }) {
  const story = faWorkshopStory(profile && profile.workshop) || FA_WORKSHOP_STORIES[0];
  const [done, setDone] = useW(loadFaTasks);
  const toggle = (key) => {
    const next = done.includes(key) ? done.filter(k => k !== key) : done.concat([key]);
    setDone(next);
    saveFaTasks(next);
  };
  return (
    <div className="fa-screen">
      <ScreenHeader eyebrow={L('Vědomé utrácení')} title={L('Workshop')} />

      <Card style={{ marginBottom: 22 }}>
        <div className="fa-ws-head">
          <Medallion icon={story.icon} accent={story.accent} size={46} />
          <div style={{ minWidth: 0 }}>
            <h2 className="fa-cardtitle">{L(story.who)}</h2>
            <p className="fa-ws-sub" style={{ margin: 0 }}>{L(story.title)}</p>
          </div>
        </div>
        <p className="fa-ws-text">{L(story.situation)}</p>
        <dl className="fa-ws-facts">
          <div>
            <dt>{L('Příjem měsíčně')}</dt>
            <dd>{kc(faStoryIncome(story))}</dd>
          </div>
          {story.income.length > 1 && story.income.map(x => (
            <div key={x.name} className="fa-ws-part">
              <dt>{faDataLabel(x.name)}</dt>
              <dd>{kc(x.amount)}</dd>
            </div>
          ))}
        </dl>
        <h3 className="fa-ws-h3">{L('Utraceno tenhle měsíc')}</h3>
        <dl className="fa-ws-facts">
          {story.spent.map(x => (
            <div key={x.name} className="fa-ws-part">
              <dt>{faDataLabel(x.name)}</dt>
              <dd>{kc(x.amount)}</dd>
            </div>
          ))}
        </dl>
        <p className="fa-ws-note">{L('Smyšlený příběh, částky jsou orientační.')}</p>
      </Card>

      <div className="fa-ws-tasks-head">
        <h2 className="fa-seclabel">{L('Úkoly')}</h2>
        <span aria-live="polite">{Lf('Hotovo {done} z {all}', { done: done.length, all: FA_WORKSHOP_TASKS.length })}</span>
      </div>
      <Card pad={0} style={{ overflow: 'hidden', marginBottom: 22 }}>
        {FA_WORKSHOP_TASKS.map((task, i) => {
          const on = done.includes(task.key);
          const id = 'fa-ws-task-' + task.key;
          return (
            <div key={task.key} className="fa-ws-task" data-on={on} style={{ borderTop: i ? '1px solid var(--card-line)' : 'none' }}>
              <span className="fa-ws-box">
                <input type="checkbox" id={id} checked={on} onChange={() => toggle(task.key)} />
                <Icon name="check" size={15} stroke={2.4} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 className="fa-ws-task-title"><label htmlFor={id}>{(i + 1) + '. ' + L(task.title)}</label></h3>
                {task.add && (
                  <p className="fa-ws-surprise">
                    <span>{faDataLabel(story.surprise.name)}</span>
                    <strong>{kc(story.surprise.amount)}</strong>
                  </p>
                )}
                <p className="fa-ws-task-body">{Lf(task.body, { goal: L(story.goal) })}</p>
                <button className="fa-ghostbtn fa-ws-go" onClick={() => (task.add ? onAdd(story.surprise) : go(task.go))}>
                  {L(task.action)} <Icon name="chevron" size={14} stroke={2} />
                </button>
              </div>
            </div>
          );
        })}
      </Card>

      <SectionLabel>{L('Konec workshopu')}</SectionLabel>
      <Card pad={0} style={{ overflow: 'hidden', marginBottom: 22 }}>
        <p className="fa-ws-end">{L('Na konci workshop smaž, na sdíleném zařízení vždycky. Tvoje vlastní data v tomhle prohlížeči zůstanou, jak byla.')}</p>
        <div style={{ borderTop: '1px solid var(--card-line)' }}>
          <DangerRow label={L('Ukončit a smazat')} confirmLabel={L('Opravdu smazat workshop?')} onConfirm={endWorkshop} />
        </div>
        <DataRow icon="book" accent="sage" label={L('Pro lektora')} sub={L('Odkaz, QR kód, časový plán a otázky')} onClick={() => go('lektor')} border />
      </Card>
    </div>
  );
}

// one part of the guide: a card on its own screen, a plain section inside the welcome card
function GuidePart({ inCard, children }) {
  return inCard
    ? <section className="fa-ws-part-plain">{children}</section>
    : <Card style={{ marginBottom: 16 }}><section>{children}</section></Card>;
}

// ── for the facilitator: how to start, timing, questions, the end ──
// inCard: inside the welcome card (before a story), else a screen of its own
function WorkshopGuide({ inCard, onBack }) {
  const lang = getFaLang();
  const link = faWorkshopLink(lang);
  const [copied, setCopied] = useW(false);
  const canCopy = typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText;
  const copy = () => { navigator.clipboard.writeText(link).then(() => setCopied(true), () => {}); };
  return (
    <div className={inCard ? 'fa-ws-guide' : 'fa-screen fa-ws-guide'}>
      <button className="fa-textbtn fa-ws-back" onClick={onBack}>
        <Icon name="chevron" size={15} stroke={2} style={{ transform: 'rotate(180deg)' }} /> {L('Zpět')}
      </button>
      {inCard
        ? <h1 className="fa-onb-h">{L('Pro lektora')}</h1>
        : <ScreenHeader eyebrow={L('Workshop')} title={L('Pro lektora')} />}

      <GuidePart inCard={inCard}>
        <h2 className="fa-ws-h2">{L('Jak začít')}</h2>
        <div className="fa-ws-qrbox">
          <img className="fa-ws-qr" src={'assets/workshop-qr-' + lang + '.svg'} width="152" height="152" alt={L('QR kód s odkazem na workshop')} />
          <div style={{ minWidth: 0 }}>
            <p className="fa-ws-link">{link.replace(/^https:\/\//, '')}</p>
            {canCopy && (
              <button className="fa-ghostbtn" onClick={copy}>
                <Icon name={copied ? 'check' : 'leaf'} size={14} stroke={2} /> {copied ? L('Odkaz zkopírován') : L('Kopírovat odkaz')}
              </button>
            )}
          </div>
        </div>
        <p className="fa-ws-text">{L('Ukaž QR kód nebo odkaz. Účastníci ho otevřou v prohlížeči telefonu: nic se neinstaluje a nikdo se nepřihlašuje. Po prvním načtení funguje workshop i bez připojení.')}</p>
      </GuidePart>

      <GuidePart inCard={inCard}>
        <h2 className="fa-ws-h2">{L('Sada pro lektory')}</h2>
        <p className="fa-ws-text">{L('Plán lekce na 90 i 45 minut, pracovní listy k tisku, snímky a dotazník. Česky a anglicky.')}</p>
        <div className="fa-ws-kit">
          {faWorkshopKit(lang).map(k => (
            <a key={k.href} className="fa-ghostbtn" href={k.href} target="_blank" rel="noopener">
              <Icon name="book" size={14} stroke={2} /> {L(k.label)} <small>PDF</small>
            </a>
          ))}
        </div>
      </GuidePart>

      <GuidePart inCard={inCard}>
        <h2 className="fa-ws-h2">{L('Časový plán, asi 45 minut')}</h2>
        <ol className="fa-ws-time">
          {FA_WORKSHOP_TIMING.map(([min, text]) => (
            <li key={text}>
              <span className="fa-ws-min">{Lf('{n} min', { n: min })}</span>
              <span>{L(text)}</span>
            </li>
          ))}
        </ol>
      </GuidePart>

      <GuidePart inCard={inCard}>
        <h2 className="fa-ws-h2">{L('Otázky k diskusi')}</h2>
        {FA_WORKSHOP_TASKS.map((task, i) => (
          <div key={task.key} className="fa-ws-qgroup">
            <h3 className="fa-ws-h3">{(i + 1) + '. ' + L(task.title)}</h3>
            <ul>
              {FA_WORKSHOP_QUESTIONS[task.key].map(q => <li key={q}>{L(q)}</li>)}
            </ul>
          </div>
        ))}
      </GuidePart>

      <GuidePart inCard={inCard}>
        <h2 className="fa-ws-h2">{L('Na konci')}</h2>
        <p className="fa-ws-text">{L('Ať každý klepne na Ukončit a smazat, na sdílených zařízeních vždycky. Na vlastním telefonu se workshop s daty účastníka nemíchá, i tak je dobré ho smazat.')}</p>
        <p className="fa-ws-text">{L('Příběhy jsou smyšlené a částky orientační. Klidně je slovně uprav podle skupiny.')}</p>
      </GuidePart>
    </div>
  );
}

// the guide as a screen of the app (from the Workshop tab or More)
function WorkshopGuideScreen({ go }) { return <WorkshopGuide onBack={() => go('workshop')} />; }

Object.assign(window, {
  FA_SITE, FA_WORKSHOP_STORIES, FA_WORKSHOP_TASKS, FA_WORKSHOP_TIMING, FA_WORKSHOP_QUESTIONS, FA_WORKSHOP_KIT,
  faWorkshopLink, faDemoLink, faWorkshopKit, faWorkshopStory, faStoryIncome, loadFaTasks, saveFaTasks, faStartWorkshop,
  WorkshopWelcome, Workshop, WorkshopGuide, WorkshopGuideScreen, DemoBar,
});
