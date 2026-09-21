# 06 — Lista: „zaległe" liczone z `Terminu kontroli`, nie z wieku zdjęcia

Type: task
Status: ready-for-agent
Blocked by: brak
Spec: .scratch/lesion-list-filters/spec.md

## Co dostarcza

Plakietka „zaległe" na liście znamion ma znaczyć to samo co w Kontrolach: że
`Termin kontroli` już minął. Dziś lista liczy ją z wieku ostatniego zdjęcia,
więc przy ręcznie przesuniętym terminie w przyszłość potrafi pokazać przyszłą
datę **i** „zaległe" jednocześnie.

## Kryteria akceptacji

- [ ] `overdue` na liście = `Termin kontroli` w przeszłości (jak w Kontrolach).
- [ ] `Znamię` z ręcznym terminem w przyszłości NIE pokazuje „zaległe".
- [ ] `overdueDays` (wiek ostatniego zdjęcia) znika z `lesionView`, jeśli przestaje być potrzebne.
- [ ] Testy pokrywają: termin w przeszłości = zaległe, w przyszłości = nie.

## Comments

- Znalezione przez `/code-review` po ticketach 01–05. Ta sama rodzina błędu co
  ticket 02 (lista vs Kontrole), tylko o krok dalej — lista pokazuje wspólny
  termin, ale zaległość liczy jeszcze po staremu.
