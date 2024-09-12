import os
from flask import Flask, render_template, jsonify, request, redirect, url_for, flash
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Product
from forms import LoginForm, RegistrationForm, ProductForm
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Test database connection
with app.app_context():
    try:
        db.create_all()
        print("Database connected successfully!")
    except Exception as e:
        print(f"Error connecting to the database: {e}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and check_password_hash(user.password, form.password.data):
            login_user(user)
            return redirect(url_for('dashboard'))
        flash('Invalid username or password')
    return render_template('login.html', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegistrationForm()
    if form.validate_on_submit():
        hashed_password = generate_password_hash(form.password.data)
        new_user = User(username=form.username.data, email=form.email.data, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        flash('Registration successful. Please log in.')
        return redirect(url_for('login'))
    return render_template('register.html', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    total_products = Product.query.count()
    low_stock_items = Product.query.filter(Product.quantity < 10).count()
    return render_template('dashboard.html', total_products=total_products, low_stock_items=low_stock_items)

@app.route('/products')
@login_required
def products():
    products = Product.query.all()
    return render_template('products.html', products=products)

@app.route('/api/products', methods=['GET', 'POST', 'PUT', 'DELETE'])
@login_required
def api_products():
    if request.method == 'GET':
        products = Product.query.all()
        return jsonify([product.to_dict() for product in products])
    
    elif request.method == 'POST':
        if not current_user.is_admin:
            return jsonify({"error": "Unauthorized"}), 403
        form = ProductForm()
        if form.validate_on_submit():
            new_product = Product(name=form.name.data, description=form.description.data, quantity=form.quantity.data, price=form.price.data)
            db.session.add(new_product)
            db.session.commit()
            return jsonify(new_product.to_dict()), 201
        return jsonify({"error": "Invalid form data"}), 400
    
    elif request.method == 'PUT':
        if not current_user.is_admin:
            return jsonify({"error": "Unauthorized"}), 403
        product_id = request.json.get('id')
        product = Product.query.get(product_id)
        if not product:
            return jsonify({"error": "Product not found"}), 404
        form = ProductForm(data=request.json)
        if form.validate():
            product.name = form.name.data
            product.description = form.description.data
            product.quantity = form.quantity.data
            product.price = form.price.data
            db.session.commit()
            return jsonify(product.to_dict())
        return jsonify({"error": "Invalid form data"}), 400
    
    elif request.method == 'DELETE':
        if not current_user.is_admin:
            return jsonify({"error": "Unauthorized"}), 403
        product_id = request.json.get('id')
        product = Product.query.get(product_id)
        if not product:
            return jsonify({"error": "Product not found"}), 404
        db.session.delete(product)
        db.session.commit()
        return jsonify({"message": "Product deleted successfully"}), 200

@app.route('/api/search')
@login_required
def search_products():
    query = request.args.get('q', '')
    products = Product.query.filter(Product.name.ilike(f'%{query}%')).all()
    return jsonify([product.to_dict() for product in products])

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
