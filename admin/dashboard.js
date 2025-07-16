// dashboard.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  IMAGE_BUCKET,
  VIDEO_BUCKET
} from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Debug output
function logToPage(message) {
  const logBox = document.getElementById('debug-log');
  logBox.style.display = 'block';
  logBox.innerHTML = `<strong>Debug:</strong> ${message}`;
}

// Form elements
const form = document.getElementById('product-form');
const nameInput = document.getElementById('name');
const categorySelect = document.getElementById('category');
const tagsInput = document.getElementById('tags');
const priceInput = document.getElementById('price');
const imagesInput = document.getElementById('images');
const videoInput = document.getElementById('video');
const imagePreview = document.getElementById('image-preview');
const tableBody = document.getElementById('product-table-body');

const quill = new Quill('#editor', { theme: 'snow' });

// Categories
function loadCategories() {
  const categories = ["Syrups", "Tablets", "Injections", "Creams", "Supplements"];
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// Image preview
imagesInput.addEventListener('change', () => {
  imagePreview.innerHTML = '';
  Array.from(imagesInput.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'preview-img';
      imagePreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

// Upload to Supabase
async function uploadFile(file, bucket, path) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true
  });

  if (error) throw error;

  const { publicUrl } = supabase.storage.from(bucket).getPublicUrl(path).data;
  return publicUrl;
}

// Save Product
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const category = categorySelect.value;
  const tags = tagsInput.value.trim();
  const price = parseFloat(priceInput.value);
  const description_html = quill.root.innerHTML;

  if (!name || !category || !price || !description_html) {
    alert("⚠️ Fill all required fields.");
    return;
  }

  try {
    const imageUrls = [];
    for (let i = 0; i < imagesInput.files.length; i++) {
      const path = `products/${Date.now()}_${imagesInput.files[i].name}`;
      const url = await uploadFile(imagesInput.files[i], IMAGE_BUCKET, path);
      imageUrls.push(url);
    }

    let videoUrl = '';
    if (videoInput.files.length > 0) {
      const path = `products/${Date.now()}_${videoInput.files[0].name}`;
      videoUrl = await uploadFile(videoInput.files[0], VIDEO_BUCKET, path);
    }

    const { error } = await supabase
      .from('products')
      .insert([{
        name, category, tags, price, description_html, image_urls: imageUrls, video_url: videoUrl
      }]);

    if (error) throw error;

    alert("✅ Product uploaded!");
    form.reset();
    quill.root.innerHTML = '';
    imagePreview.innerHTML = '';
    loadProducts();

  } catch (err) {
    logToPage("❌ Upload failed: " + err.message);
  }
});

// Load Products
async function loadProducts() {
  tableBody.innerHTML = "<tr><td colspan='4'>⏳ Loading...</td></tr>";

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !products) {
    tableBody.innerHTML = "<tr><td colspan='4'>❌ Failed to load products.</td></tr>";
    return;
  }

  if (products.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='4'>📭 No products yet.</td></tr>";
    return;
  }

  tableBody.innerHTML = '';
  products.forEach(prod => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${prod.name}</td>
      <td>${prod.category}</td>
      <td>₦${prod.price}</td>
      <td><button onclick="deleteProduct('${prod.id}')">🗑️ Delete</button></td>
    `;
    tableBody.appendChild(tr);
  });
}

// Delete Product
async function deleteProduct(id) {
  if (!confirm("❗ Delete this product?")) return;

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    alert("❌ Failed to delete.");
    return;
  }

  alert("🗑️ Deleted successfully.");
  loadProducts();
}

// Init
loadCategories();
loadProducts();
