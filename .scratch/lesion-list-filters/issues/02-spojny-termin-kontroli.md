# 02 — Spójny `Termin kontroli` w Liście znamion

Type: task
Status: ready-for-agent
Blocked by: 01
Spec: .scratch/lesion-list-filters/spec.md

## Co dostarcza

Lista znamion pokazuje ten sam `Termin kontroli` co zakładka Kontrole: ręcznie
ustawiony (`next_check_at`), a gdy go brak — wyliczony z `Interwału kontroli`.
Dziś lista ignoruje ręczny termin i liczy własną datę, przez co oba widoki się
rozjeżdżają.

## Kryteria akceptacji

- [ ] Lista respektuje ręcznie ustawiony `Termin kontroli` z bazy.
- [ ] Bez ręcznego terminu data = ostatnie `Zdjęcie` + `Interwał kontroli`.
- [ ] Dla tego samego `Znamienia` data na liście = data w Kontrolach.
- [ ] Testy pokrywają oba przypadki.

## Comments

- Zlecone przez `/to-tickets` z `spec.md`. Brama dla ticketu 04 (sortowanie po terminie).
