# Login Edu — Question Schema Contract

Ini adalah kontrak untuk mengunggah soal (Exercises/Tryouts) ke sistem Login Edu. Pastikan file JSON Anda sesuai dengan spesifikasi di bawah.

## Format File
File harus berupa format `.json` yang valid, atau disalin (copy-paste) ke text area di Panel Admin.

## Struktur Utama

Root objek JSON harus memiliki field `questions` berupa array dari soal-soal.
(Abaikan `sections` jika Anda melihat referensi di tempat lain, format yang baru menggunakan array flat `questions` secara langsung).

```json
{
  "questions": [
    // ... objek soal di sini
  ]
}
```

## Spesifikasi Base (Untuk Semua Tipe Soal)

Setiap soal **WAJIB** memiliki field-field dasar berikut:

- `id` (Number): ID unik untuk soal tersebut dalam file (dimulai dari 1 dan berurutan).
- `type` (String): Tipe soal (`multiple_choice`, `matching`, `essay`, `short_answer`, `listening`).
- `text` (String): Teks utama dari soal.
- `scoring` (Object): Pengaturan poin (opsional jika ingin seragam, tapi disarankan diset per soal).
  - `correct` (Number): Poin jika benar.
  - `incorrect` (Number): Poin jika salah (bisa negatif).
  - `unanswered` (Number): Poin jika tidak dijawab.

## 1. Pilihan Ganda (`multiple_choice`)

```json
{
  "id": 1,
  "type": "multiple_choice",
  "text": "Siapakah penemu bola lampu?",
  "scoring": { "correct": 4, "incorrect": -1, "unanswered": 0 },
  "options": [
    { "key": "A", "text": "Thomas Edison" },
    { "key": "B", "text": "Nikola Tesla" },
    { "key": "C", "text": "Albert Einstein" }
  ],
  "correct_answer": "A"
}
```

## 2. Menjodohkan (`matching`)

```json
{
  "id": 2,
  "type": "matching",
  "text": "Jodohkan negara dengan ibukotanya.",
  "scoring": { "correct": 5, "incorrect": 0, "unanswered": 0 },
  "left_items": [
    { "key": "L1", "text": "Indonesia" },
    { "key": "L2", "text": "Jepang" }
  ],
  "right_items": [
    { "key": "R1", "text": "Tokyo" },
    { "key": "R2", "text": "Jakarta" }
  ],
  "correct_pairs": [
    { "left": "L1", "right": "R2" },
    { "left": "L2", "right": "R1" }
  ]
}
```

## 3. Listening / Audio (`listening`)

```json
{
  "id": 3,
  "type": "listening",
  "text": "Dengarkan audio berikut dan jawab pertanyaannya:",
  "audio_url": "https://drive.google.com/file/d/xxxxxxx/view",
  "scoring": { "correct": 4, "incorrect": 0, "unanswered": 0 },
  "options": [
    { "key": "A", "text": "Pilihan 1" },
    { "key": "B", "text": "Pilihan 2" }
  ],
  "correct_answer": "A"
}
```

## 4. Uraian Singkat (`short_answer`)

Soal ini butuh koreksi manual admin.

```json
{
  "id": 4,
  "type": "short_answer",
  "text": "Sebutkan nama presiden pertama Indonesia.",
  "scoring": { "correct": 0, "incorrect": 0, "unanswered": 0 },
  "auto_gradable": false,
  "max_score": 10
}
```

## 5. Essay (`essay`)

Soal ini butuh koreksi manual admin.

```json
{
  "id": 5,
  "type": "essay",
  "text": "Jelaskan proses terjadinya hujan.",
  "scoring": { "correct": 0, "incorrect": 0, "unanswered": 0 },
  "auto_gradable": false,
  "max_score": 20
}
```
