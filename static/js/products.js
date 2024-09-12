document.addEventListener('DOMContentLoaded', function() {
    const productList = document.getElementById('productList');
    const productForm = document.getElementById('productForm');
    const searchInput = document.getElementById('searchInput');

    function fetchProducts() {
        fetch('/api/products')
            .then(response => response.json())
            .then(products => {
                productList.innerHTML = '';
                products.forEach(product => {
                    const productCard = createProductCard(product);
                    productList.appendChild(productCard);
                });
            })
            .catch(error => {
                console.error('Error fetching products:', error);
                showNotification('Failed to fetch products', 'error');
            });
    }

    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'bg-white shadow-md rounded-lg p-4';
        card.innerHTML = `
            <h3 class="text-xl font-semibold mb-2">${product.name}</h3>
            <p class="text-gray-600 mb-2">${product.description}</p>
            <p class="font-bold mb-2">Quantity: ${product.quantity}</p>
            <p class="font-bold mb-2">Price: ${formatCurrency(product.price)}</p>
            ${isAdmin() ? `
                <button class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded mr-2 edit-product" data-id="${product.id}">Edit</button>
                <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded delete-product" data-id="${product.id}">Delete</button>
            ` : ''}
        `;
        return card;
    }

    function isAdmin() {
        // This function should check if the current user is an admin
        // For simplicity, we'll assume it's always true in this example
        return true;
    }

    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(productForm);
            const productData = Object.fromEntries(formData.entries());
            const productId = document.getElementById('productId').value;

            const url = productId ? `/api/products` : '/api/products';
            const method = productId ? 'PUT' : 'POST';

            if (productId) {
                productData.id = productId;
            }

            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
            })
            .then(response => response.json())
            .then(data => {
                showNotification('Product saved successfully');
                productForm.reset();
                document.getElementById('productId').value = '';
                fetchProducts();
            })
            .catch(error => {
                console.error('Error saving product:', error);
                showNotification('Failed to save product', 'error');
            });
        });
    }

    productList.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-product')) {
            const productId = e.target.getAttribute('data-id');
            fetch(`/api/products/${productId}`)
                .then(response => response.json())
                .then(product => {
                    document.getElementById('productId').value = product.id;
                    document.getElementById('name').value = product.name;
                    document.getElementById('description').value = product.description;
                    document.getElementById('quantity').value = product.quantity;
                    document.getElementById('price').value = product.price;
                })
                .catch(error => {
                    console.error('Error fetching product details:', error);
                    showNotification('Failed to fetch product details', 'error');
                });
        } else if (e.target.classList.contains('delete-product')) {
            const productId = e.target.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this product?')) {
                fetch(`/api/products`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: productId }),
                })
                .then(response => response.json())
                .then(data => {
                    showNotification('Product deleted successfully');
                    fetchProducts();
                })
                .catch(error => {
                    console.error('Error deleting product:', error);
                    showNotification('Failed to delete product', 'error');
                });
            }
        }
    });

    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        fetch(`/api/search?q=${searchTerm}`)
            .then(response => response.json())
            .then(products => {
                productList.innerHTML = '';
                products.forEach(product => {
                    const productCard = createProductCard(product);
                    productList.appendChild(productCard);
                });
            })
            .catch(error => {
                console.error('Error searching products:', error);
                showNotification('Failed to search products', 'error');
            });
    });

    fetchProducts();
});
