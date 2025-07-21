// ✅ UPGRADED DASHBOARD.JS — Liyog Pharmacy CMS (Product Upload)

// ⬛ CONFIG IMPORT
import { supabase } from './config.js';

// 🔁 Global State
let currentEditId = null;
let allProducts = [];

// 🧱 DOM Elements
const form = document.getElementById('productForm');
const nameInput = document.getElementById('productName');
const categorySelect = document.getElementById('category');
const tagsInput = document.getElementById('tags');
const priceInput = document.getElementById('price');
const discountInput = document.getElementById('discount');
const cartonQtyInput = document.getElementById('cartonQty');
const descriptionInput = document.getElementById('description');
const imageInput = document.getElementById('images');
const videoFileInput = document.getElementById('videoFile');
const youtubeInput = document.getElementById('youtube');
const previewContainer = document.getElementById('preview');
const productTable = document.getElementById('productTable');
const saveBtn = document.getElementById('saveBtn');
const statusToggle = document.getElementById('publishStatus');

// 🔃 Load Categories
async function loadCategories() {
  const { data, error } = await supabase.from('categories').select('*');
  if (error) return alert('Error loading categories');
  categorySelect.innerHTML = data.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
}

// 🧠 Auto Calculate Price per Carton
function updateCartonPrice() {
  const unitPrice = parseFloat(priceInput.value) || 0;
  const qty = parseInt(cartonQtyInput.value) || 0;
  const discount = parseFloat(discountInput.value) || 0;
  const total = (unitPrice * qty) * ((100 - discount) / 100);
  document.getElementById('cartonPrice').textContent = `₦${total.toFixed(2)}`;
}

// 🔁 Listen for auto calc
[priceInput, discountInput, cartonQtyInput].forEach(input => input.addEventListener('input', updateCartonPrice));

// 📺 Live Preview
function updatePreview() {
  const images = imageInput.files;
  const name = nameInput.value;
  const desc = descriptionInput.value;
  const videoURL = youtubeInput.value || (videoFileInput.files[0] ? URL.createObjectURL(videoFileInput.files[0]) : '');
  
  let previewHTML = `<h3>${name}</h3><p>${desc}</p>`;
  if (images.length > 0) {
    Array.from(images).forEach(file => {
      const url = URL.createObjectURL(file);
      previewHTML += `<img src="${url}" width="100">`;
    });
  }
  if (videoURL) {
    if (youtubeInput.value) {
      previewHTML += `<iframe width="300" height="200" src="https://www.youtube.com/embed/${extractYouTubeId(videoURL)}"></iframe>`;
    } else {
      previewHTML += `<video src="${videoURL}" width="300" controls></video>`;
    }
  }
  previewContainer.innerHTML = previewHTML;
}

imageInput.addEventListener('change', updatePreview);
youtubeInput.addEventListener('input', updatePreview);
videoFileInput.addEventListener('change', updatePreview);
descriptionInput.addEventListener('input', updatePreview);

function extractYouTubeId(url) {
  const match = url.match(/(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : '';
}

// 📦 Submit Product
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  const name = nameInput.value.trim();
  const category = categorySelect.value;
  const tags = tagsInput.value.trim();
  const price = parseFloat(priceInput.value);
  const discount = parseFloat(discountInput.value);
  const qty = parseInt(cartonQtyInput.value);
  const desc = descriptionInput.value.trim();
  const status = statusToggle.checked ? 'published' : 'draft';
  const id = currentEditId ?? Date.now();

  // Upload images
  const imageFiles = imageInput.files;
  let imageUrls = [];
  for (let file of imageFiles) {
    const { data, error } = await supabase.storage.from('product-images').upload(`product-${id}/${file.name}`, file, { upsert: true });
    if (!error) {
      const url = supabase.storage.from('product-images').getPublicUrl(data.path).data.publicUrl;
      imageUrls.push(url);
    }
  }

  // Upload video if provided
  let videoUrl = '';
  if (videoFileInput.files[0]) {
    const { data, error } = await supabase.storage.from('product-videos').upload(`product-${id}/${videoFileInput.files[0].name}`, videoFileInput.files[0], { upsert: true });
    if (!error) {
      videoUrl = supabase.storage.from('product-videos').getPublicUrl(data.path).data.publicUrl;
    }
  } else if (youtubeInput.value) {
    videoUrl = youtubeInput.value;
  }

  const product = {
    id,
    name,
    category,
    tags,
    price,
    discount,
    carton_qty: qty,
    description: desc,
    images: imageUrls,
    video: videoUrl,
    status,
    updated_at: new Date().toISOString()
  };

  let result;
  if (currentEditId) {
    result = await supabase.from('products').update(product).eq('id', currentEditId);
  } else {
    result = await supabase.from('products').insert([product]);
  }

  if (result.error) {
    alert('Failed to save product');
  } else {
    alert('Product saved successfully');
    form.reset();
    previewContainer.innerHTML = '';
    currentEditId = null;
    loadProducts();
  }

  saveBtn.disabled = false;
  saveBtn.textContent = 'Save Product';
});

// 📝 Load Products
async function loadProducts() {
  const { data, error } = await supabase.from('products').select('*').order('updated_at', { ascending: false });
  if (error) return alert('Error loading products');
  allProducts = data;
  renderProductTable();
}

// 🔁 Render Table
function renderProductTable() {
  productTable.innerHTML = allProducts.map(p => `
    <tr>
      <td>${p.id}</td>
      <td><img src="${p.images?.[0]}" width="40"></td>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>₦${p.price}</td>
      <td>${p.status}</td>
      <td>
        <button onclick="editProduct(${p.id})">Edit</button>
        <button onclick="deleteProduct(${p.id})">Delete</button>
      </td>
    </tr>`).join('');
}

// ✏️ Edit Mode
window.editProduct = async function (id) {
  const { data } = await supabase.from('products').select('*').eq('id', id).single();
  if (!data) return alert('Product not found');
  nameInput.value = data.name;
  categorySelect.value = data.category;
  tagsInput.value = data.tags;
  priceInput.value = data.price;
  discountInput.value = data.discount;
  cartonQtyInput.value = data.carton_qty;
  descriptionInput.value = data.description;
  youtubeInput.value = data.video.includes('youtube') ? data.video : '';
  statusToggle.checked = data.status === 'published';
  currentEditId = data.id;
  updateCartonPrice();
  updatePreview();
}

// ❌ Delete Product
window.deleteProduct = async function (id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return alert('Delete failed');
  loadProducts();
}

// 🚀 Init
loadCategories();
loadProducts();
    
