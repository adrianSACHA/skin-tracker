# Skin Tracker

Prywatna aplikacja do systematycznej, fotograficznej dokumentacji znamion w czasie. Jedno konto prowadzi obserwację jednej lub kilku osób (np. „Ja" i „Syn"); zdjęcia służą do porównywania zmian w czasie — nigdy do ich oceny.

## Language

### Rdzeń

**Konto**:
Zalogowany właściciel danych. Jedno konto prowadzi obserwację jednej lub kilku osób.
_Avoid_: użytkownik, właściciel, profil

**Osoba**:
Podmiot, którego znamiona się dokumentuje — np. „Ja" albo „Syn". Należy do jednego konta i gromadzi pod sobą swoje znamiona oraz mapy ciała.
_Avoid_: profil, pacjent

**Znamię**:
Pojedynczy punkt na ciele, obserwowany w czasie przez zdjęcia i notatki. Należy do dokładnie jednej osoby.
_Avoid_: zmiana skórna, lesja, lesion

**Nazwa znamienia**:
Krótka etykieta znamięcia nadana przez osobę (np. „kark"). Wolna i nieunikalna — może się powtarzać.
_Avoid_: identyfikator, ID

### Zdjęcia i pomiar

**Zdjęcie**:
Jeden zapis znamienia z danej daty — obraz wraz z pomiarem i notatkami ABCDE.
_Avoid_: sesja, fotografia

**Pomiar**:
Rozmiar znamienia (mm, ew. mm²) odczytany z obrysu zdjęcia po kalibracji.
_Avoid_: szacowanie, ocena rozmiaru

**Obrys**:
Zaznaczony na zdjęciu kontur znamienia, z którego liczy się pomiar.
_Avoid_: maska, kontur

**Kalibracja**:
Odniesienie skali (np. znana średnica monety) pozwalające przeliczyć obrys na milimetry.
_Avoid_: skalowanie

**ABCDE**:
Pięć cech znamienia notowanych ręcznie: asymetria, brzeg, kolor, średnica, ewolucja.
_Avoid_: ocena, ryzyko

### Organizacja

**Status**:
Prywatna etykieta organizacyjna znamienia — jedna z pięciu: `Nowe`, `Stabilne`, `Do obserwacji`, `Wymaga uwagi`, `Usunięte`. Nie jest oceną medyczną (patrz ADR-0001).
_Avoid_: priorytet, ocena, ryzyko

**Mapa ciała**:
Zdjęcie referencyjne ciała jednej osoby, do którego przypina się znamiona.
_Avoid_: plansza, schemat

**Widok**:
Jedna część mapy ciała: przód, tył, lewa, prawa, przód nóg, tył nóg.
_Avoid_: strona, ujęcie

### Kontrole

**Kontrola**:
Ponowne obejrzenie i udokumentowanie znamienia w ustalonym terminie.
_Avoid_: przegląd, wizyta

**Termin kontroli**:
Data następnej kontroli znamienia; ustalana ręcznie albo wyliczana z interwału.
_Avoid_: deadline

**Interwał kontroli**:
Domyślna liczba tygodni między kolejnymi kontrolami.
_Avoid_: częstotliwość

**Przypomnienie**:
Powiadomienie wysyłane z wyprzedzeniem przed terminem kontroli; wyprzedzenie ustawia się per osoba.
_Avoid_: alarm, notyfikacja
