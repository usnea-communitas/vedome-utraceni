// fa-storage.jsx — where the app keeps its data in this browser.
// Every read and write goes through faStorage instead of localStorage, so a
// workshop (opened with ?workshop=1, see fa-workshop.jsx) works on its own
// copy: its keys carry the prefix 'fa.workshop.' ('fa.plans' becomes
// 'fa.workshop.plans'), and a participant's own data is never read or changed
// while the workshop runs. Ending the workshop deletes its keys and nothing else.

const FA_WORKSHOP_PREFIX = 'fa.workshop.';

// a workshop runs while the address carries ?workshop=1
const FA_IN_WORKSHOP = (() => {
  try { return new URLSearchParams(location.search).get('workshop') === '1'; } catch (e) { return false; }
})();

// the stored key for one of the app's keys ('fa.…')
function faKey(key) {
  return FA_IN_WORKSHOP && key.startsWith('fa.') ? FA_WORKSHOP_PREFIX + key.slice(3) : key;
}

const faStorage = {
  get(key) { try { return localStorage.getItem(faKey(key)); } catch (e) { return null; } },
  set(key, value) { try { localStorage.setItem(faKey(key), value); } catch (e) {} },
  remove(key) { try { localStorage.removeItem(faKey(key)); } catch (e) {} },
};

// the keys a workshop keeps in this browser
function faWorkshopKeys() {
  const keys = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(FA_WORKSHOP_PREFIX)) keys.push(k);
    }
  } catch (e) {}
  return keys;
}
// deletes the workshop's data, and only that
function faClearWorkshop() {
  faWorkshopKeys().forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
}

Object.assign(window, { FA_IN_WORKSHOP, FA_WORKSHOP_PREFIX, faKey, faStorage, faWorkshopKeys, faClearWorkshop });
