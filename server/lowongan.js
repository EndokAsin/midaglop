// Import Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// =================================================================================
// KONFIGURASI SUPABASE
// =================================================================================
const SUPABASE_URL = 'https://koubjqxoolmevvsluven.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdWJqcXhvb2xtZXZ2c2x1dmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NDc3ODIsImV4cCI6MjA3MDAyMzc4Mn0.FzTWIeq1AV_Qtdight8-E3AhsdDMBXSvvV1N7mskHnE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =================================================================================
// State untuk menyimpan filter
// =================================================================================
let currentSearchTerm = '';
let currentCategory = '';

// =================================================================================
// FUNGSI UTAMA
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Set tahun di footer
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
    
    // Setup event listener untuk menu mobile
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if(mobileMenuButton) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Muat data awal dan siapkan filter
    loadCategories();
    fetchAndDisplayAllJobs();
    setupEventListeners();
});

// =================================================================================
// FUNGSI-FUNGSI LOGIKA
// =================================================================================

// Memuat dan menampilkan kategori sebagai tombol filter
async function loadCategories() {
    const container = document.getElementById('category-filters');
    if (!container) return;

    const { data, error } = await supabase.from('kategori_pekerjaan').select('nama_kategori').order('nama_kategori');

    if (error) {
        container.innerHTML = `<p class="text-red-500">Gagal memuat kategori.</p>`;
        return;
    }

    container.innerHTML = `
        <button class="category-btn active bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded-full shadow transition" data-category="">
            Semua Kategori
        </button>
    `;
    data.forEach(cat => {
        container.innerHTML += `
            <button class="category-btn bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded-full shadow transition" data-category="${cat.nama_kategori}">
                ${cat.nama_kategori}
            </button>
        `;
    });
}

// Mengambil dan menampilkan lowongan berdasarkan filter
async function fetchAndDisplayAllJobs() {
    const container = document.getElementById('job-listings-all');
    if (!container) return;

    container.innerHTML = '<div class="text-center col-span-full py-12"><p class="text-gray-500">Mencari lowongan...</p></div>';

    let query = supabase
        .from('lowongan_pekerjaan')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    // Terapkan filter pencarian
    if (currentSearchTerm) {
        query = query.ilike('posisi', `%${currentSearchTerm}%`);
    }

    // Terapkan filter kategori
    if (currentCategory) {
        query = query.eq('kategori', currentCategory);
    }

    const { data: jobs, error } = await query;

    if (error) {
        console.error('Error fetching jobs:', error);
        container.innerHTML = '<p class="text-red-500 col-span-full text-center">Gagal memuat lowongan pekerjaan.</p>';
        return;
    }

    if (jobs.length === 0) {
        container.innerHTML = '<p class="text-gray-500 col-span-full text-center">Tidak ada lowongan yang cocok dengan kriteria Anda.</p>';
        return;
    }

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

    addDetailButtonListeners();
}

// Menyiapkan event listener untuk search bar dan filter kategori
function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const categoryContainer = document.getElementById('category-filters');

    // Debounce untuk search input agar tidak memanggil API terus-menerus
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentSearchTerm = e.target.value;
            fetchAndDisplayAllJobs();
        }, 500); // Tunggu 500ms setelah user berhenti mengetik
    });

    // Event listener untuk tombol kategori
    categoryContainer.addEventListener('click', (e) => {
        if (e.target.matches('.category-btn')) {
            // Hapus kelas 'active' dari semua tombol
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active', 'bg-blue-600', 'text-white'));
            // Tambahkan kelas 'active' ke tombol yang diklik
            e.target.classList.add('active', 'bg-blue-600', 'text-white');
            
            currentCategory = e.target.dataset.category;
            fetchAndDisplayAllJobs();
        }
    });
}

// Fungsi untuk menampilkan modal detail (sama seperti di main.js)
function addDetailButtonListeners() {
    const modal = document.getElementById('job-detail-modal');
    if (!modal) return;
    
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

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.querySelector('div').classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }
    });
}
