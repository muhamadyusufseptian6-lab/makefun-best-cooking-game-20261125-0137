[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/muhamadyusufseptian6-lab/makefun-best-cooking-game-20261125-0137/rank.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/muhamadyusufseptian6-lab/makefun-best-cooking-game-20261125-0137/reward.svg)](https://make.fun/c/best-cooking-game-20261125-0137)

# ⚡ Dapur Petir — Warung Kilat

Warung kaki lima tengah malam yang masaknya kilat, pelanggannya lapar, dan
cabainya jangan pelit. Game masak orisinal yang jalan offline di desktop
Chrome dari file statis — tanpa network request, tanpa library.

## Cara main

Pesanan masuk di **papan pesanan** di atas, lengkap dengan timernya sendiri.
Klik tiket untuk memilih pesanan, lalu klik bahan di atas meja (atau tekan
**1–9**) untuk merakit hidangan di piring. Kalau semua bahan resep sudah
naik ke piring, piring bersinar **SIAP DISAJIKAN** — bunyikan bel atau tekan
**SPASI** sebelum pelanggan kabur.

- 🍚 **Nasi Goreng Petir** — nasi, telur, kecap, cabai
- 🍜 **Mie Goreng Kilat** — mie, telur, ayam, kecap
- 🍢 **Sate Kilat** — sate, kecap, cabai
- 🍗 **Ayam Geprek** — nasi, ayam, cabai
- 🧋 **Es Teh Manis** — teh, gula
- 🍜 **Mie Nyemek** — mie, telur, cabai

Satu piring, satu pesanan: ganti tiket berarti piring dikosongkan. Bahan
yang salah bikin piring hangus — buang dengan **T**. Sajikan cepat untuk
dapat tip, sajikan beruntun untuk combo. Tiap 45 detik ada **RUSH HOUR**:
pesanan dobel, koin x2. Shift 2 menit, 3 pesanan hangus dan warung tutup.

Pelanggan tetap: Bang Ojek, Mbak Sari, Pak RT, Mas Budi, Tante Rosa,
Om Gendut, Dek Kiko — dan Kak Kunti, yang pesan tengah malam juga. 👻

## Kontrol

| Aksi | Cara |
| --- | --- |
| Pilih pesanan | Klik tiket / `←` `→` / `Tab` |
| Tambah bahan | Klik bahan di meja / tombol `1`–`9` |
| Sajikan | Klik bel / `Spasi` |
| Buang piring | Klik tong sampah / `T` |
| Jeda | `P` |
| Suara | `M` |
| Mulai / main lagi | `Enter` / `R` / klik |

## Main lokal

```sh
node serve.ts
# buka http://localhost:8080 di desktop Chrome
```

## Struktur

- `game/index.html` + `game/style.css` — cangkang dan tampilan
- `game/src/main.js` — boot, loop, shift, rush hour, dan semua aksi pemain
- `game/src/recipes.js` — bahan, resep, dan pelanggan warung
- `game/src/orders.js` — papan pesanan: tiket masuk, timer, pelanggan kabur
- `game/src/plate.js` — piring mid-assembly dan skor (koin, tip, combo)
- `game/src/render.js` — semua gambar dapur di satu canvas + hit-test klik
- `game/src/sounds.js` — bunyi masak hasil sintesis WebAudio, tanpa file audio
- `game/src/controls.js` — keyboard + mouse
- `main.ts` — program penyerahan (Node 22, stdlib-only): menyalin `game/` +
  `screenshots/` ke `/output` dan menulis `/output/dossier.json`
- `vendor/makefun-game.ts` — salinan kit, tanpa diubah

## Entri

Kompetisi [Make the best cooking game](https://make.fun/c/best-cooking-game-20261125-0137)
di make.fun — 10 besar berbagi $250. Dibangun dari brief kompetisi, semua
kode, gambar, suara, dan nama adalah karya sendiri.

---
Dibangun dengan make.fun — coba pakai kode referral `515temp1` saat daftar.
