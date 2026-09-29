# 09 — Nawigacja na telefonie: zostawić, dolny pasek czy hamburger

Type: task
Status: wontfix
Map: .scratch/backlog/map.md

## Problem

Nawigacja (Mapa ciała / Lista znamion / Kontrole) to pasek w nagłówku zajmujący
**52 px** na telefonie. Po odchudzeniu nagłówka (ticket 08: 286 → 121 px) nie
jest już głównym problemem, ale zostaje do decyzji: czy trzy zakładki mają
dalej siedzieć u góry.

## Do decyzji (needs-triage)

- **Zostawić w nagłówku** — najmniejszy ruch. 52 px to ~8% wysokości ekranu,
  a wszystkie trzy zakładki są widoczne od razu, bez dodatkowego dotknięcia.
- **Dolny pasek** (jak w aplikacjach mobilnych) — zabiera 52 px z góry, dodaje
  ~56 px na dole, ale jest w zasięgu kciuka i to standard w zainstalowanych
  aplikacjach. Koszt: prawdziwy refaktor — nawigacja wychodzi z nagłówka, każdy
  ekran potrzebuje odstępu na dole, a iPhone `safe-area-inset-bottom`
  (bez tego pasek wchodzi pod pasek gestów).
- **Hamburger** — uwalnia 52 px, ale chowa nawigację za dotknięciem. Przy
  trzech zakładkach prawdopodobnie gorzej niż zostawić je widoczne.

## Propozycja

Zmierzyć najpierw, jak wygląda po tickecie 08 — użytkownik zdecydował, że
decyzję o dolnym pasku podejmiemy po odchudzeniu nagłówka (i mówi: „później
sprawdzimy”).

Jeśli dolny pasek: dołożyć go **obok** istniejącego testu budżetu
(`e2e/ui-budget.spec.js`) — budżet powinien wtedy pilnować także odstępu treści
od dołu, żeby pasek nie zasłaniał ostatniego wiersza listy.

## Answer — `wontfix` (2026-09-29)

Zmierzone przy okazji ticketu 12 (375×667): nagłówek 121 px, z czego pasek
zakładek **52 px** (8% wysokości ekranu).

**Dolny pasek nie rozwiązuje żadnego problemu, który tu mamy.** Przenosi te
same ~52 px z góry na dół (plus `safe-area-inset-bottom` na iPhone), więc:

- nie zmniejsza chromu — a to chrom, nie nawigacja, zjada ekran (ticket 13),
- kolidowałby z zakładkami sekcji (Przegląd / Zdjęcia / Trend) na ekranie
  znamienia — dwie nawigacje na jednym ekranie.

**Hamburger** uwolniłby 52 px, ale przy trzech zakładkach chowa nawigację za
dotknięciem — zła wymiana. **Zostawienie w nagłówku** nie kosztuje nic, a
wszystkie trzy pozycje są widoczne od razu i skrócone na telefonie
(`Mapa` / `Znamiona` / `Kontrole`), co i tak zostało zrobione przy tickecie 08.

Decyzja jest odwracalna — jeśli w praktyce okaże się, że przełączanie między
tymi trzema ekranami jedną ręką jest uciążliwe, wracamy do tematu.
