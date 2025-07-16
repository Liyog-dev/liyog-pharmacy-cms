// dashboard.js

const quill = new Quill('#editor', { theme: 'snow' });

const form = document.getElementById('product-form');
const nameInput = document.getElementById('name');
const categoryInput = document.getElementById('category');
const tagsInput = document.getElementById('tags');
const priceInput = document.getElementById('price');
const imagesInput = document.getElementById('images');
const videoInput = document.getElementById('video');
const previewContainer = document.getElementById('image-preview');
const tableBody = document.getElementById('product-table-body');

// Load Categories
function loadCategories() {
  const categories = ['Syrups', 'Tablets', 'Creams', 'Supplements', 'Injections'];
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryInput.appendChild(opt);
  });
}

// Preview image thumbnails
imagesInput.addEventListener('change', () => {
  previewContainer.innerHTML = '';
  [...imagesInput.files].forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'preview-img';
      previewContainer.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

// Upload any file to storage and return its public URL
async function uploadFile(file, bucket, folder = 'products') {
  const filePath = `${folder}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
  if (error) {
    console.error('Storage upload error:', error);
    throw error;
  }

  const { publicUrl } = supabase.storage.from(bucket).getPublicUrl(filePath).data;
  return publicUrl;
}

// Submit form
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const category = categoryInput.value;
  const tags = tagsInput.value.trim();
  const price = parseFloat(priceInput.value);
  const description_html = quill.root.innerHTML.trim();

  if (!name || !category || !tags || !price || !description_html) {
    alert("⚠️ Please fill out all required fields.");
    return;
  }

  try {
    // Upload Images
    const imageFiles = Array.from(imagesInput.files);
    if (imageFiles.length === 0) {
      alert("⚠️ Please upload at least one product image.");
      return;
    }

    const imageUrls = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const img = imageFiles[i];
      const uploadedUrl = await uploadFile(img, IMAGE_BUCKET);
      imageUrls.push(uploadedUrl);
    }

    // Optional Video Upload
    let videoUrl = '';
    if (videoInput.files.length > 0) {
      const videoFile = videoInput.files[0];
      videoUrl = await uploadFile(videoFile, VIDEO_BUCKET);
    }

    // Final Product Object
    const product = {
      name,
      category,
      tags,
      price,
      description_html,
      image_urls: imageUrls,
      video_url: videoUrl
    };

    console.log("🛠️ Final Product Object →", product);

    const { error } = await supabase.from('products').insert([product]);
    if (error) {
      console.error('❌ Supabase Insert Error:', error);
      alert('❌ Upload failed: ' + error.message);
      return;
    }

    alert("✅ Product uploaded successfully!");
    form.reset();
    quill.setContents([]);
    previewContainer.innerHTML = '';
    loadProducts();

  } catch (err) {
    console.error('❌ Upload failed:', err);
    alert("❌ Something went wrong. Check console for error.");
  }
});

// Load Products into the table
async function loadProducts() {
  tableBody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;

  const { data: products, error } = await supabase.from('products').select('*');

  if (error) {
    console.error("❌ Failed to load products:", error);
    tableBody.innerHTML = `<tr><td colspan="4">Error loading products</td></tr>`;
    return;
  }

  if (!products.length) {
    tableBody.innerHTML = `<tr><td colspan="4">No products found</td></tr>`;
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

// Delete a product by ID
async function deleteProduct(id) {
  const confirmDelete = confirm("Are you sure you want to delete this product?");
  if (!confirmDelete) return;

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    console.error("❌ Delete Error:", error);
    alert("Failed to delete product.");
    return;
  }

  alert("✅ Product deleted.");
  loadProducts();
}

// Init
loadCategories();
loadProducts();
