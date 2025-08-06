import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://koubjqxoolmevvsluven.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdWJqcXhvb2xtZXZ2c2x1dmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NDc3ODIsImV4cCI6MjA3MDAyMzc4Mn0.FzTWIeq1AV_Qtdight8-E3AhsdDMBXSvvV1N7mskHnE';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentFilters = {};
let debounceTimer;

async function fetchAndDisplayTrainings() {
    const container = document.getElementById('training-list');
    container.innerHTML = `<p class="col-span-full text-center text-gray-500">Memuat pelatihan...</p>`;

    let query = supabase.from('pelatihan').select('*').eq('is_active', true);

    Object.keys(currentFilters).forEach(key => {
        const value = currentFilters[key];
        if (value && value.length > 0) {
            if (key === 'search') {
                query = query.or(`nama_pelatihan.ilike.%${value}%,kejuruan.ilike.%${value}%`);
            } else if (Array.isArray(value)) {
                query = query.in(key, value);
            } else {
                query = query.eq(key, value);
            }
        }
    });
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = `<p class="col-span-full text-center text-red-500">Gagal memuat data.</p>`;
        console.error(error);
        return;
    }

    if (data.length === 0) {
        container.innerHTML = `<p class="col-span-full text-center text-gray-500">Tidak ada pelatihan yang cocok.</p>`;
        return;
    }

    container.innerHTML = data.map(item => `
        <div class="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transform hover:-translate-y-2 transition-transform duration-300">
            <div class="h-40 bg-cover bg-center" style="background-image: url('${item.backdrop_url || 'https://placehold.co/600x400/c4b5fd/ffffff?text=Pelatihan'}')"></div>
            <div class="p-6 flex-grow flex flex-col">
                <div class="flex items-start space-x-4">
                    <img src="${item.logo_perusahaan_url || 'https://placehold.co/100x100/ffffff/8b5cf6?text=Logo'}" alt="Logo Mitra" class="h-16 w-16 rounded-lg object-contain border p-1 -mt-12 bg-white shadow-md">
                    <div>
                        <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                            ${item.kejuruan || 'Umum'}
                        </span>
                        <h3 class="text-xl font-bold text-gray-800 mt-2">${item.nama_pelatihan}</h3>
                        <p class="text-sm text-gray-500">${item.lokasi || 'Lokasi tidak tersedia'}</p>
                    </div>
                </div>
                
                <div class="mt-4 text-sm text-gray-600 flex-grow">
                    <p class="line-clamp-3">${item.deskripsi}</p>
                </div>

                <div class="mt-4 pt-4 border-t border-gray-100">
                    <div class="flex justify-between items-center">
                        <p class="text-lg font-bold text-purple-700">${item.program_pelatihan === 'Gratis' ? 'Gratis' : 'Rp ' + (item.harga || 0).toLocaleString('id-ID')}</p>
                        <button data-id="${item.id}" class="show-training-detail-button font-semibold text-purple-600 hover:text-purple-800">Lihat Detail →</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    addTrainingDetailButtonListeners();
}

function handleFilterChange() {
    const form = document.getElementById('filter-form');
    const formData = new FormData(form);
    currentFilters = {};

    const programPelatihan = formData.getAll('program_pelatihan');
    if (programPelatihan.length > 0) currentFilters.program_pelatihan = programPelatihan;

    const tipePelatihan = formData.getAll('tipe_pelatihan');
    if (tipePelatihan.length > 0) currentFilters.tipe_pelatihan = tipePelatihan;
    
    const tingkatKesulitan = formData.get('tingkat_kesulitan');
    if (tingkatKesulitan) currentFilters.tingkat_kesulitan = tingkatKesulitan;

    const tipeMitra = formData.get('tipe_mitra');
    if (tipeMitra) currentFilters.tipe_mitra = tipeMitra;

    const search = document.getElementById('search-input').value;
    if (search) currentFilters.search = search;

    fetchAndDisplayTrainings();
}

function setupEventListeners() {
    const form = document.getElementById('filter-form');
    form.addEventListener('change', handleFilterChange);
    
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(handleFilterChange, 500);
    });
}

function addTrainingDetailButtonListeners() {
    const modal = document.getElementById('training-detail-modal');
    if (!modal) return;
    
    const buttons = document.querySelectorAll('.show-training-detail-button');
    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            const trainingId = button.dataset.id;
            const { data: item, error } = await supabase
                .from('pelatihan')
                .select('*')
                .eq('id', trainingId)
                .single();

            if(error) {
                console.error('Error fetching training detail', error);
                return;
            }
            
            const modalContent = `
                <div class="relative">
                    <img src="${item.backdrop_url || 'https://placehold.co/800x300/c4b5fd/ffffff?text=Pelatihan'}" class="w-full h-48 object-cover rounded-t-xl">
                    <button id="close-modal-button" class="absolute top-4 right-4 bg-white/70 rounded-full p-2 text-gray-700 hover:bg-white text-2xl leading-none">&times;</button>
                </div>
                <div class="p-8">
                    <h2 class="text-3xl font-bold text-gray-800">${item.nama_pelatihan}</h2>
                    <p class="text-md text-gray-500 mb-4">${item.kejuruan || 'Umum'}</p>
                    <div class="flex flex-wrap gap-4 text-sm mb-6">
                        <span class="bg-gray-100 p-2 rounded-md">📍 ${item.lokasi || 'N/A'}</span>
                        <span class="bg-purple-100 text-purple-800 p-2 rounded-md">🎓 ${item.tingkat_kesulitan || 'N/A'}</span>
                        <span class="bg-green-100 text-green-800 p-2 rounded-md">💰 ${item.program_pelatihan === 'Gratis' ? 'Gratis' : 'Rp ' + (item.harga || 0).toLocaleString('id-ID')}</span>
                        <span class="bg-yellow-100 text-yellow-800 p-2 rounded-md">🕒 ${item.tipe_pelatihan || 'N/A'}</span>
                        ${item.rating ? `<span class="bg-orange-100 text-orange-800 p-2 rounded-md flex items-center">★<span class="ml-1">${item.rating}</span></span>` : ''}
                    </div>
                    <div class="space-y-4">
                        <div>
                            <h4 class="font-semibold text-lg mb-2">Deskripsi Pelatihan</h4>
                            <p class="text-gray-600 whitespace-pre-wrap">${item.deskripsi || 'Tidak ada deskripsi.'}</p>
                        </div>
                    </div>
                    <button class="w-full mt-8 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">Daftar Sekarang</button>
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

document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayTrainings();
    setupEventListeners();
});
