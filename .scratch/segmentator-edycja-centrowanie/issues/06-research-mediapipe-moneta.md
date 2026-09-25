# 06 — Czy MediaPipe Object Detector wykryje monetę / linijkę (automatyzacja kroku 1)

Type: research
Status: resolved
Map: .scratch/segmentator-edycja-centrowanie/map.md

## Pytanie

Czy MediaPipe Object Detector (albo inny lekki, on-device model) potrafi wykryć
monetę/linijkę na zdjęciu znamienia, żeby zautomatyzować krok 1 (kalibrację)?

Zakres:

- dostępność i rozmiar modelu, wersja zgodna z `@mediapipe/tasks-vision` (1.0.1),
- czy zadziała dla monet PLN (`COIN_PRESETS`: 15,5–24,0 mm) i dla linijki (skala cm),
- czy detekcja jest wystarczająco pewna, by proponować punkty kalibracji, czy
  tylko podświetlać kandydata do potwierdzenia przez użytkownika.

To przetwarzanie lokalne (on-device) — nie wysyła zdjęcia do chmury.
Wynik zasila grilling 07 (opcja „automatyczne wykrywanie skali").

## Answer

**Sprawdzone na źródłach (docs MediaPipe Tasks + labelmap):**

- Object Detector korzysta z modeli **EfficientDet-Lite0 / Lite2** oraz
  **SSD MobileNetV2** — wszystkie trenowane na **COCO (80 klas)**.
  Pełna lista: `storage.googleapis.com/mediapipe-tasks/object_detector/labelmap.txt`
  (pobrana i sprawdzona). Zawiera m.in. `person, car, cat, dog, bottle, scissors,
  book, cell phone…`, ale **nie ma `coin` / `money` / `ruler` / `scale`**.
- **Wniosek: out-of-the-box NIE wykryje ani monety, ani linijki.** Żadna
  pre-trenowana głowa MediaPipe nie ma tych klas. Własny model = dataset + trening
  + hosting (ciężkie, nieproporcjonalne do celu prywatnej aplikacji).

**Realne opcje automatyzacji kroku 1:**

- **A. Reuse `InteractiveSegmenter`** (już w apce): użytkownik klika **raz** w
  monetę → maska → bbox → średnica w px. Ten sam model, **bez nowej zależności**,
  ale nadal wymaga kliknięcia i potwierdzenia. Dla **linijki** (prostokąt) mniej
  pewne — trzeba by wykrywać końce odcinka, co jest już trudniejsze.
- **B. Custom TFLite detektor monet/linijki** — odrzucone (dataset, trening,
  hosting; nieproporcjonalne).
- **C. Ręczna kalibracja 2-punktowa** — status quo; dokładna i tania.

**Rekomendacja:** zostawić **C** jako baseline; ewentualnie później dołożyć **A**
(„klik na monetę → auto-średnica") jako nice-to-have. **Teraz: żadnego nowego
modelu ani zależności.**

To przetwarzanie lokalne (on-device) i czysta geometria — zgodne z ADR-0001.
Wynik zasila `07` (opcja „automatyczne wykrywanie skali" jest droższa, niż się wydaje).
