// dashboard.js

const quill = new Quill('#editor', { theme: 'snow' });

const form = document.getElementById('product-form'); const nameInput = document.getElementById('name'); const categoryInput = document.getElementById('category'); const tagsInput = document.getElementById('tags'); const priceInput = document.getElementById('price'); const discountInput = document.getElementById('discount'); const imageInput = document.getElementById('images'); const videoInput = document.getElementById('video'); const publishedInput = document.getElementById('published'); const previewBtn = document.getElementById('preview-btn'); const previewContent = document.getElementById('preview-content'); const previewModal = document.getElementById('preview-modal'); const submitBtn = document.getElementById('submit-btn'); const logPanel = document.getElementById('log-panel'); const tableBody = document.getElementById('product-table-body');

let editingId = null; let originalImageURLs = []; let originalVideoURL = null;

const log = (msg) => { logPanel.innerHTML += \n${msg}; };

const resetForm = () => { form.reset(); quill.setText(''); document.getElementById('image-preview').innerHTML = ''; editingId = null; originalImageURLs = []; originalVideoURL = null; submitBtn.textContent = '💾 Save Product'; };

const renderImagePreviews = (urls) => { const container = document.getElementById('image-preview'); container.innerHTML = ''; urls.forEach(url => { const img = document.createElement('img'); img.src = url; img.className = 'preview-img'; container.appendChild(img); }); };

const renderVideoPreview = (url) => { const container = document.getElementById('image-preview'); if (url) { const video = document.createElement('video'); video.src = url; video.controls = true; video.style.maxWidth = '100%'; video.style.marginTop = '10px'; container.appendChild(video); } };

const showPreviewModal = () => { const name = nameInput.value; const category = categoryInput.value; const tags = tagsInput.value; const price = priceInput.value; const discount = discountInput.value; const description = quill.root.innerHTML; const published = publishedInput.checked;

previewContent.innerHTML = <h2>${name}</h2> <p><strong>Category:</strong> ${category}</p> <p><strong>Tags:</strong> ${tags}</p> <p><strong>Price:</strong> ₦${price}</p> <p><strong>Discount:</strong> ${discount || 0}%</p> <p><strong>Status:</strong> ${published ? 'Published' : 'Unpublished'}</p> <div>${description}</div>;

originalImageURLs.forEach(url => { const img = document.createElement('img'); img.src = url; previewContent.appendChild(img); });

if (originalVideoURL) { const video = document.createElement('video'); video.src = originalVideoURL; video.controls = true; previewContent.appendChild(video); }

const closeBtn = document.createElement('button'); closeBtn.textContent = 'Close Preview'; closeBtn.onclick = () => previewModal.style.display = 'none'; previewContent.appendChild(closeBtn);

previewModal.style.display = 'flex'; };

previewBtn.addEventListener('click', showPreviewModal);

form.addEventListener('submit', async (e) => { e.preventDefault();

const product = { name: nameInput.value, category: categoryInput.value, tags: tagsInput.value.split(',').map(tag => tag.trim()), price: parseFloat(priceInput.value), discount: parseFloat(discountInput.value) || 0, description: quill.root.innerHTML, published: publishedInput.checked, images: originalImageURLs, video: originalVideoURL };

if (imageInput.files.length > 0) { // upload new images product.images = []; for (const file of imageInput.files) { const { data, error } = await supabase.storage.from('products').upload(images/${Date.now()}-${file.name}, file); if (data) { const url = supabase.storage.from('products').getPublicUrl(data.path).data.publicUrl; product.images.push(url); } } }

if (videoInput.files.length > 0) { const file = videoInput.files[0]; const { data, error } = await supabase.storage.from('products').upload(videos/${Date.now()}-${file.name}, file); if (data) { product.video = supabase.storage.from('products').getPublicUrl(data.path).data.publicUrl; } }

if (editingId) { const { error } = await supabase.from('products').update(product).eq('id', editingId); if (!error) log(✔ Product updated.); } else { const { error } = await supabase.from('products').insert(product); if (!error) log(✔ Product created.); }

resetForm(); loadProducts(); });

const editProduct = (data) => { editingId = data.id; nameInput.value = data.name; categoryInput.value = data.category; tagsInput.value = data.tags.join(', '); priceInput.value = data.price; discountInput.value = data.discount; publishedInput.checked = data.published; quill.root.innerHTML = data.description;

originalImageURLs = data.images || []; originalVideoURL = data.video || null;

renderImagePreviews(originalImageURLs); renderVideoPreview(originalVideoURL);

submitBtn.textContent = '💾 Update Product'; window.scrollTo(0, 0); };

const loadProducts = async () => { const { data, error } = await supabase.from('products').select('*').order('product_number', { ascending: false }); tableBody.innerHTML = ''; data.forEach(product => { const row = document.createElement('tr'); row.innerHTML = <td>${product.product_number || ''}</td> <td><img src="${(product.images && product.images[0]) || ''}" class="thumbnail-img"></td> <td>${product.name}</td> <td>${product.category}</td> <td>₦${product.price}</td> <td>${product.published ? 'Published' : 'Unpublished'}</td> <td> <button onclick='editProduct(${JSON.stringify(product)})'>✏️</button> </td>; tableBody.appendChild(row); }); };

loadProducts();

                                                                                                            
