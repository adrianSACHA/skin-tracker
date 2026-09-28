// Domyślne ustawienia dokumentacji w jednym miejscu.
//
// Trzymane osobno od `interval.js`, bo tamten importuje Reacta i Supabase.
// Dzięki temu czyste moduły (np. `summary.js`) mogą użyć tych wartości bez
// wciągania klienta Supabase do testów jednostkowych.

// Domyślny interwał kontroli w tygodniach (gdy osoba nie ma jeszcze zapisanej
// własnej wartości w `monitored_persons.interval_weeks`).
export const DEFAULT_INTERVAL_WEEKS = 6
