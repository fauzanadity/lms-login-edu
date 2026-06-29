import http from 'k6/http';
import { check, sleep } from 'k6';

// Konfigurasi K6
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up ke 50 user
    { duration: '1m', target: 200 },  // Ramp-up ke 200 user
    { duration: '2m', target: 200 },  // Tahan di 200 user selama 2 menit (simulasi mengerjakan tryout)
    { duration: '30s', target: 0 },   // Ramp-down
  ],
};

// URL lokal atau production
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Simulasi siswa mengakses halaman login
  let res = http.get(`${BASE_URL}/login`);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);

  // Catatan: K6 tidak bisa secara langsung mensimulasikan login Supabase Auth (via widget Turnstile) tanpa setup khusus.
  // Script ini berfungsi sebagai skeleton untuk menguji route statis atau API ringan.
  // Untuk uji beban tryout penuh (auto-save), buat endpoint dummy khusus testing atau gunakan token JWT admin yang sudah di-generate.
}
