// dashboard.js (fully fixed and polished version)

// Load products on page load
document.addEventListener('DOMContentLoaded', async () => {
  await fetchAndRenderProducts();
});

// Global state for edit mode
let editingProductId = null;
let originalImageUrl = null;
let originalVideoUrl = null;

// Fetch and render products
async function fetchAndRenderProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  const container = document.getElementById('productList');
  container.innerHTML = '';

  data.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';

    card.innerHTML = `
      <h3>${product.name} (#${String(product.product_number).padStart(3, '0')})</h3>
      <p>${product.description}</p>
      <p><strong>Price:</strong> ₦${product.final_price}</p>
      ${product.percentage_discount ? `<p><del>₦${calculateOriginalPrice(product.final_price, product.percentage_discount)}</del> <span>(${product.percentage_discount}% OFF)</span></p>` : ''}
      ${product.image_url ? `<img src="${product.image_url}" alt="Product Image" class="preview-img">` : ''}
      ${product.video_url ? `<video src="${product.video_url}" controls class="preview-video"></video>` : ''}
      <p>Status: <strong>${product.published ? 'Published ✅' : 'Unpublished ❌'}</strong></p>
      <button onclick='editProduct(${JSON.stringify(product)})'>Edit</button>
      <button onclick='previewProduct(${JSON.stringify(product)})'>Preview</button>
    `;
    container.appendChild(card);
  });
}

// Calculate original price based on discount
function calculateOriginalPrice(final, percent) {
  return Math.round((final * 100) / (100 - percent));
}

// Handle form submission
document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;

  const name = form.name.value;
  const description = form.description.value;
  const final_price = parseFloat(form.final_price.value);
  const percentage_discount = parseInt(form.percentage_discount.value) || 0;
  const published = form.published.checked;

  let imageFile = form.image.files[0];
  let videoFile = form.video.files[0];

  let image_url = originalImageUrl;
  let video_url = originalVideoUrl;

  if (imageFile) {
    const { data, error } = await supabase.storage
      .from('media')
      .upload(`images/${Date.now()}_${imageFile.name}`, imageFile, { upsert: true });
    if (data) {
      const { publicURL } = supabase.storage.from('media').getPublicUrl(data.path);
      image_url = publicURL;
    }
  }

  if (videoFile) {
    const { data, error } = await supabase.storage
      .from('media')
      .upload(`videos/${Date.now()}_${videoFile.name}`, videoFile, { upsert: true });
    if (data) {
      const { publicURL } = supabase.storage.from('media').getPublicUrl(data.path);
      video_url = publicURL;
    }
  }

  const payload = {
    name,
    description,
    final_price,
    percentage_discount,
    image_url,
    video_url,
    published,
  };

  let result;

  if (editingProductId) {
    result = await supabase
      .from('products')
      .update(payload)
      .eq('id', editingProductId);
  } else {
    result = await supabase
      .from('products')
      .insert(payload);
  }

  if (result.error) {
    alert('Error saving product');
    console.error(result.error);
  } else {
    alert(editingProductId ? 'Product updated!' : 'Product added!');
    editingProductId = null;
    originalImageUrl = null;
    originalVideoUrl = null;
    form.reset();
    await fetchAndRenderProducts();
  }
});

// Edit product function
function editProduct(product) {
  const form = document.getElementById('productForm');

  form.name.value = product.name;
  form.description.value = product.description;
  form.final_price.value = product.final_price;
  form.percentage_discount.value = product.percentage_discount || '';
  form.published.checked = product.published;

  originalImageUrl = product.image_url;
  originalVideoUrl = product.video_url;
  editingProductId = product.id;

  window.scrollTo(0, 0);
}

// Preview product modal
function previewProduct(product) {
  const modal = document.getElementById('previewModal');
  const content = document.getElementById('previewContent');

  content.innerHTML = `
    <h2>${product.name}</h2>
    <p>${product.description}</p>
    <p><strong>Product #:</strong> LYG-${String(product.product_number).padStart(3, '0')}</p>
    <p><strong>Price:</strong> ₦${product.final_price}</p>
    ${product.percentage_discount ? `<p><del>₦${calculateOriginalPrice(product.final_price, product.percentage_discount)}</del> <span>(${product.percentage_discount}% OFF)</span></p>` : ''}
    ${product.image_url ? `<img src="${product.image_url}" class="preview-img" alt="Product Image">` : ''}
    ${product.video_url ? `<video src="${product.video_url}" controls class="preview-video"></video>` : ''}
    <p>Status: ${product.published ? '✅ Published' : '❌ Unpublished'}</p>
    <button onclick="document.getElementById('previewModal').style.display='none'">Close</button>
  `;
  modal.style.display = 'block';
}

// Optional: click outside to close modal
window.onclick = function (event) {
  const modal = document.getElementById('previewModal');
  if (event.target == modal) {
    modal.style.display = 'none';
  }
};
