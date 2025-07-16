// 📌 Visual log function for mobile debugging
function logToPage(message) {
  const logBox = document.getElementById('debug-log');
  logBox.style.display = 'block';
  logBox.innerHTML = `<strong>Debug:</strong> ${message}`;
}

// 📌 Supabase setup
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  IMAGE_BUCKET,
  VIDEO_BUCKET
} from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 📌 Quill editor
const quill = new Quill('#editor', {
  theme: 'snow'
});

// 📌 DOM Elements
const form = document.getElementById('product-form');
const nameInput = document.getElementById('name');
const categorySelect = document.getElementById('category');
const tagsInput = document.getElementById('tags');
const priceInput = document.getElementById('price');
const imagesInput = document.getElementById('images');
const videoInput = document.getElementById('video');
const imagePreview = document.getElementById('image-preview');
const tableBody = document.getElementById('product-table-body');

// 📌 Load categories
async function loadCategories() {
  const staticCategories = ["Syrups", "Tablets", "Injections", "Creams", "Supplements"];
  staticCategories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// 📌 Image preview
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

// 📌 Upload to Supabase storage
async function uploadFile(file, bucket, path) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  const { publicUrl } = supabase.storage.from(bucket).getPublicUrl(path).data;
  return publicUrl;
}

// 📌 Handle form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  logToPage("🟢 Uploading product...");

  const name = nameInput.value.trim();
  const category = categorySelect.value;
  const tags = tagsInput.value.trim();
  const price = parseFloat(priceInput.value);
  const description_html = quill.root.innerHTML;

  if (!name || !category || !price || !description_html) {
    logToPage("❌ Please fill all required fields.");
    return;
  }

  try {
    // Upload images
    const imageFiles = Array.from(imagesInput.files);
    const imageUrls = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const imgPath = `products/${Date.now()}_${imageFiles[i].name}`;
      const url = await uploadFile(imageFiles[i], IMAGE_BUCKET, imgPath);
      imageUrls.push(url);
    }

    // Upload video (optional)
    let videoUrl = '';
    if (videoInput.files.length > 0) {
      const videoPath = `products/${Date.now()}_${videoInput.files[0].name}`;
      videoUrl = await uploadFile(videoInput.files[0], VIDEO_BUCKET, videoPath);
    }

    // Insert into Supabase
    const { error } = await supabase
      .from('products')
      .insert([{
        name,
        category,
        tags,
        price,
        description_html,
        image_urls: imageUrls,
        video_url: videoUrl
      }]);

    if (error) throw error;

    logToPage("✅ Product uploaded successfully!");
    form.reset();
    quill.root.innerHTML = '';
    imagePreview.innerHTML = '';
    loadProducts();

  } catch (err) {
    logToPage("❌ Upload failed: " + err.message);
  }
});

// 📌 Load products
async function loadProducts() {
  tableBody.innerHTML = "<tr><td colspan='4'>⏳ Loading...</td></tr>";

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !products) {
    logToPage("❌ Failed to load products.");
    tableBody.innerHTML = "<tr><td colspan='4'>❌ Failed to load products.</td></tr>";
    return;
  }

  if (products.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='4'>📭 No products found.</td></tr>";
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

// 📌 Delete product
async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    logToPage("❌ Error deleting product.");
    return;
  }

  logToPage("🗑️ Product deleted.");
  loadProducts();
}

// 📌 Initial load
loadCategories();
loadProducts();
