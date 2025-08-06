// Import Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// =================================================================================
// KONFIGURASI SUPABASE
// Pastikan kredensial ini sama dengan yang ada di halaman admin.
// =================================================================================
const SUPABASE_URL = 'https://koubjqxoolmevvsluven.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdWJqcXhvb2xtZXZ2c2x1dmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NDc3ODIsImV4cCI6MjA3MDAyMzc4Mn0.FzTWIeq1AV_Qtdight8-E3AhsdDMBXSvvV1N7mskHnE';

// Buat koneksi ke Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =================================================================================
// FUNGSI UTAMA - Dieksekusi setelah halaman selesai dimuat
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Cek jika elemen untuk halaman publik ada
    if (document.getElementById('job-listings')) {
        handlePublicPage();
    }
});


// =================================================================================
// LOGIKA UNTUK HALAMAN PUBLIK (INDEX.HTML)
// =================================================================================
function handlePublicPage() {
    // Ambil dan tampilkan lowongan serta berita
    fetchAndDisplayJobs();
    fetchAndDisplayNews();

    // Set tahun copyright di footer
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
    
    // Fungsionalitas menu mobile
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if(mobileMenuButton) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

// --- Fungsi untuk Lowongan Pekerjaan (Publik) ---
async function fetchAndDisplayJobs() {
    const container = document.getElementById('job-listings');
    if (!container) return;

    // Ambil data dari Supabase, hanya yang aktif
    const { data: jobs, error } = await supabase
        .from('lowongan_pekerjaan')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching jobs:', error);
        container.innerHTML = '<p class="text-red-500 col-span-full text-center">Gagal memuat lowongan pekerjaan.</p>';
        return;
    }

    if (jobs.length === 0) {
        container.innerHTML = '<p class="text-gray-500 col-span-full text-center">Saat ini belum ada lowongan yang tersedia.</p>';
        return;
    }

    // Kosongkan container dan isi dengan data baru
    container.innerHTML = '';
    jobs.forEach(job => {
        const typeBadgeColor = job.tipe_pekerjaan === 'Magang' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
        const jobCard = `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 flex flex-col">
                <div class="h-40 bg-cover bg-center" style="background-image: url('${job.backdrop_url || 'https://placehold.co/600x400/e0f2fe/3b82f6?text=Midaglop'}')"></div>
                <div class="p-6 flex-grow flex flex-col">
                    <div class="flex items-start space-x-4">
                        <img src="${job.logo_perusahaan_url || 'https://placehold.co/100x100/ffffff/3b82f6?text=Logo'}" alt="Logo" class="h-16 w-16 rounded-lg object-contain border p-1 -mt-12 bg-white shadow-md">
                        <div>
                             <div class="flex flex-wrap gap-2 mb-2">
                                <span class="text-xs ${typeBadgeColor} py-1 px-2 rounded-full font-semibold">${job.tipe_pekerjaan || 'Full-time'}</span>
                                <span class="text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded-full font-semibold">${job.kategori || 'Umum'}</span>
                            </div>
                            <h3 class="font-bold text-xl text-gray-800">${job.posisi}</h3>
                            <p class="text-gray-500 text-sm">${job.nama_perusahaan || 'Perusahaan Mitra'}</p>
                        </div>
                    </div>
                    <div class="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                        <p class="text-blue-600 font-semibold">${job.gaji || 'Gaji Kompetitif'}</p>
                        <button class="show-detail-button text-sm font-semibold text-blue-500 hover:text-blue-700" data-id="${job.id}">Lihat Detail →</button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += jobCard;
    });

    // Tambahkan event listener untuk tombol "Lihat Detail"
    addDetailButtonListeners();
}

// --- Fungsi untuk Berita (Publik) ---
async function fetchAndDisplayNews() {
    const container = document.getElementById('news-container');
    if (!container) return;

    const { data: news, error } = await supabase
        .from('berita')
        .select('*')
        .order('tanggal_berita', { ascending: false })
        .limit(6); // Ambil 6 berita terbaru

    if (error) {
        console.error('Error fetching news:', error);
        container.innerHTML = '<p class="text-red-500 col-span-full text-center">Gagal memuat berita.</p>';
        return;
    }

    if (news.length === 0) {
        container.innerHTML = '<p class="text-gray-500 col-span-full text-center">Belum ada berita yang dipublikasikan.</p>';
        return;
    }

    container.innerHTML = '';
    news.forEach(item => {
        const newsCard = `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                <img src="${item.gambar_url || 'https://placehold.co/600x400/e2e8f0/4a5568?text=Info'}" alt="Gambar Berita" class="h-48 w-full object-cover">
                <div class="p-6">
                    <p class="text-sm text-gray-500 mb-2">${new Date(item.tanggal_berita).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <h3 class="font-bold text-lg text-gray-800 mb-2">${item.judul}</h3>
                    <p class="text-gray-600 text-sm line-clamp-3">${item.deskripsi}</p>
                    <a href="#" class="text-blue-500 hover:text-blue-700 font-semibold mt-4 inline-block">Baca Selengkapnya...</a>
                </div>
            </div>
        `;
        container.innerHTML += newsCard;
    });
}

// --- Fungsi untuk Modal Detail Lowongan ---
function addDetailButtonListeners() {
    const modal = document.getElementById('job-detail-modal');
    const buttons = document.querySelectorAll('.show-detail-button');
    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            const jobId = button.dataset.id;
            const { data: job, error } = await supabase
                .from('lowongan_pekerjaan')
                .select('*')
                .eq('id', jobId)
                .single();

            if(error) {
                console.error('Error fetching job detail', error);
                return;
            }
            
            const details = job.detail_pekerjaan || {};
            const qualifications = details.kualifikasi || [];
            const benefits = details.benefit || [];
            
            const modalContent = `
                <div class="relative">
                    <img src="${job.backdrop_url || 'https://placehold.co/800x300/e0f2fe/3b82f6?text=Midaglop'}" class="w-full h-48 object-cover rounded-t-xl">
                    <button id="close-modal-button" class="absolute top-4 right-4 bg-white/70 rounded-full p-2 text-gray-700 hover:bg-white text-2xl leading-none">&times;</button>
                </div>
                <div class="p-8">
                    <h2 class="text-3xl font-bold text-gray-800">${job.posisi}</h2>
                    <p class="text-md text-gray-500 mb-4">${job.nama_perusahaan}</p>
                    <div class="flex flex-wrap gap-4 text-sm mb-6">
                        <span class="bg-gray-100 p-2 rounded-md">📍 ${job.lokasi || 'N/A'}</span>
                        <span class="bg-gray-100 p-2 rounded-md">💼 ${job.kategori || 'N/A'}</span>
                        <span class="bg-green-100 text-green-800 p-2 rounded-md">💰 ${job.gaji || 'N/A'}</span>
                        <span class="bg-yellow-100 text-yellow-800 p-2 rounded-md">🕒 ${job.tipe_pekerjaan || 'N/A'}</span>
                    </div>
                    <div class="space-y-6">
                        <div>
                            <h4 class="font-semibold text-lg mb-2">Deskripsi Pekerjaan</h4>
                            <p class="text-gray-600 whitespace-pre-wrap">${job.deskripsi}</p>
                        </div>
                        <div>
                            <h4 class="font-semibold text-lg mb-2">Kualifikasi</h4>
                            <ul class="list-disc list-inside text-gray-600 space-y-1">${qualifications.map(q => `<li>${q}</li>`).join('') || '<li>Tidak ada informasi.</li>'}</ul>
                        </div>
                        <div>
                            <h4 class="font-semibold text-lg mb-2">Benefit</h4>
                            <ul class="list-disc list-inside text-gray-600 space-y-1">${benefits.map(b => `<li>${b}</li>`).join('') || '<li>Tidak ada informasi.</li>'}</ul>
                        </div>
                    </div>
                    <button class="w-full mt-8 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Lamar Sekarang</button>
                </div>
            `;
            modal.querySelector('div').innerHTML = modalContent;
            modal.classList.remove('hidden');
            setTimeout(() => {
                 modal.querySelector('div').classList.remove('scale-95');
            }, 10);

            modal.querySelector('#close-modal-button').addEventListener('click', () => {
                 modal.querySelector('div').classList.add('scale-95');
                 setTimeout(() => modal.classList.add('hidden'), 300);
            });
        });
    });

    // Menutup modal jika klik di luar area konten
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.querySelector('div').classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }
    });
}
