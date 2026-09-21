# 02 — Sortowanie po next_check_at

Type: task
Status: needs-triage
Blocked by: 01

## Zadanie

Posortować listę po `next_check_at` rosnąco, ze znamionami bez terminu
(`next_check_at IS NULL`) na końcu.

## Pytania otwarte

- Czy sortowanie ma być stabilne przy równych terminach (np. wtórnie po `label`)?
- Czy dodać przełącznik rosnąco/malejąco, czy tylko „najpilniejsze na górze"?

## Uwagi

Zablokowane przez `01` — kontrolka sortowania dołącza do paska filtrów, który
powstaje w pierwszym tickecie.

## Comments

- Utworzone przy setupie jako przykład konwencji `.scratch/`.
