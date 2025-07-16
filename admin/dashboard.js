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

// Load static categories
function loadCategories() {
  const categories = ['Syrups', 'Tablets', 'Creams', 'Supplements', 'Injections'];
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryInput.appendChild(opt);
  });
}

// Preview images
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

// Upload single file
async function uploadFile(file, bucket, folder) {
  const path = `${folder}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true
  });
  if (error) throw error;
  const { publicUrl } = supabase.storage.from(bucket).getPublicUrl(path).data;
  return publicUrl;
}

// Save product
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const category = categoryInput.value;
  const tags = tagsInput.value.trim();
  const price = parseFloat(priceInput.value);
  const description_html = quill.root.innerHTML;

  if (!name || !category || !price || !description_html) {
    return alert('Please fill in all fields');
  }

  try {
    // Upload images
    const imageFiles = Array.from(imagesInput.files);
    const imageUrls = [];

    for (let file of imageFiles) {
      const url = await uploadFile(file, IMAGE_BUCKET, 'products');
      imageUrls.push(url);
    }

    // Upload video (optional)
    let videoUrl = '';
    if (videoInput.files.length > 0) {
      videoUrl = await uploadFile(videoInput.files[0], VIDEO_BUCKET, 'products');
    }

    // Save product to Supabase
    const { error } = await supabase.from('products').insert([
      {
        name,
        category,
        tags,
        price,
        description_html,
        image_urls: imageUrls,
        video_url: videoUrl
      }
    ]);

    if (error) throw error;

    alert('✅ Product uploaded successfully!');
    form.reset();
    quill.setContents([]);
    previewContainer.innerHTML = '';
    loadProducts();

  } catch (err) {
    console.error(err);
    alert('❌ Upload failed: ' + err.message);
  }
});

// Load products into table
async function loadProducts() {
  tableBody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;
  const { data: products, error } = await supabase.from('products').select('*');

  if (error || !products.length) {
    tableBody.innerHTML = `<tr><td colspan="4">No products yet.</td></tr>`;
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

// Delete product
async function deleteProduct(id) {
  const confirmDelete = confirm('Delete this product permanently?');
  if (!confirmDelete) return;

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return alert('Failed to delete.');
  alert('✅ Product deleted.');
  loadProducts();
}

// INIT
loadCategories();
loadProducts();
