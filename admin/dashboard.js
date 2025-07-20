// ✅ DASHBOARD.JS — Full Functional Dashboard Script for Liyog Pharmacy CMS

// ⬛ CONFIGURATION (import from external file)
import { supabase } from './config.js';

// 📌 Global Variables
let currentEditId = null;
let currentPage = 1;
let productsPerPage = 10;
let allProducts = [];

// 🧱 DOM Elements
const form = document.getElementById('productForm');
const productTable = document.getElementById('productTable');
const imagePreview = document.getElementById('imagePreview');
const videoPreview = document.getElementById('videoPreview');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const pagination = document.getElementById('pagination');

// 📁 Quill.js Editor Init
const quill = new Quill('#description', {
  theme: 'snow',
  placeholder: 'Enter product description...',
  modules: {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['link', 'image', 'video'],
      ['clean']
    ]
  }
});

// 📤 Upload Media to Supabase
async function uploadFile(file, path) {
  const { data, error } = await supabase.storage.from('products').upload(path, file, {
    cacheControl: '3600',
    upsert: true
  });
  if (error) throw error;
  const { data: urlData } = await supabase.storage.from('products').getPublicUrl(path);
  return urlData.publicUrl;
}

// 📌 Collect Form Data
async function collectFormData() {
  const title = document.getElementById('title').value;
  const category = document.getElementById('category').value;
  const tags = document.getElementById('tags').value;
  const price = document.getElementById('price').value;
  const description = quill.root.innerHTML;

  const imageFiles = document.getElementById('images').files;
  const videoFile = document.getElementById('video').files[0];

  const imageUrls = [];
  for (let img of imageFiles) {
    const path = `images/${Date.now()}-${img.name}`;
    const url = await uploadFile(img, path);
    imageUrls.push(url);
  }

  let videoUrl = '';
  if (videoFile) {
    const path = `videos/${Date.now()}-${videoFile.name}`;
    videoUrl = await uploadFile(videoFile, path);
  }

  return {
    title,
    category,
    tags,
    price,
    description,
    imageUrls,
    videoUrl,
    published: true
  };
}

// ✅ Submit Form
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const productData = await collectFormData();

  if (currentEditId) {
    await supabase.from('products').update(productData).eq('id', currentEditId);
    currentEditId = null;
  } else {
    await supabase.from('products').insert([productData]);
  }

  form.reset();
  quill.root.innerHTML = '';
  imagePreview.innerHTML = '';
  videoPreview.innerHTML = '';
  fetchProducts();
});

// 🔍 Live Image & Video Preview
form.images.onchange = () => {
  imagePreview.innerHTML = '';
  for (let img of form.images.files) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.createElement('img');
      preview.src = e.target.result;
      preview.className = 'preview-img';
      imagePreview.appendChild(preview);
    };
    reader.readAsDataURL(img);
  }
};

form.video.onchange = () => {
  videoPreview.innerHTML = '';
  const file = form.video.files[0];
  if (file) {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.controls = true;
    video.className = 'preview-video';
    videoPreview.appendChild(video);
  }
};

// 📦 Fetch Products
async function fetchProducts() {
  const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });
  if (error) return console.error(error);
  allProducts = data;
  renderProducts();
}

// 🧾 Render Products
function renderProducts() {
  let filtered = allProducts.filter(p =>
    p.title.toLowerCase().includes(searchInput.value.toLowerCase()) &&
    (!categoryFilter.value || p.category === categoryFilter.value)
  );

  const totalPages = Math.ceil(filtered.length / productsPerPage);
  const paginated = filtered.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);

  productTable.innerHTML = paginated.map(product => `
    <tr>
      <td><img src="${product.imageUrls[0]}" class="thumb" /></td>
      <td>${product.title}</td>
      <td>${product.category}</td>
      <td>₦${product.price}</td>
      <td>
        <button onclick="editProduct(${product.id})">✏️</button>
        <button onclick="deleteProduct(${product.id})">🗑️</button>
        <label class="switch">
          <input type="checkbox" ${product.published ? 'checked' : ''} onchange="togglePublish(${product.id}, this.checked)" />
          <span class="slider"></span>
        </label>
      </td>
    </tr>
  `).join('');

  pagination.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `<button onclick="goToPage(${i})" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
  }
}

// 🖋️ Edit Product
window.editProduct = async (id) => {
  const { data } = await supabase.from('products').select('*').eq('id', id).single();
  document.getElementById('title').value = data.title;
  document.getElementById('category').value = data.category;
  document.getElementById('tags').value = data.tags;
  document.getElementById('price').value = data.price;
  quill.root.innerHTML = data.description;
  currentEditId = data.id;
};

// ❌ Delete Product
window.deleteProduct = async (id) => {
  if (confirm('Delete this product?')) {
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  }
};

// 🔄 Toggle Publish Status
window.togglePublish = async (id, status) => {
  await supabase.from('products').update({ published: status }).eq('id', id);
  fetchProducts();
};

// ⏩ Pagination
window.goToPage = (page) => {
  currentPage = page;
  renderProducts();
};

// 🔍 Search & Filter Listeners
searchInput.addEventListener('input', renderProducts);
categoryFilter.addEventListener('change', renderProducts);

// 🚀 Init
fetchProducts();
  
