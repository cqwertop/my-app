import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import skiGogglesModelUrl from '../ski_goggles.glb?url';
import credentialsData from './credentials.json';
import './App.css';

const routes = [
  { id: 'home', label: 'Home' },
  { id: 'mission', label: 'Mission' },
  { id: 'team', label: 'Team' },
  { id: 'product', label: 'Product' },
  { id: 'contact', label: 'Contact' },
  { id: 'buy', label: 'Buy' },
  { id: 'login', label: 'Login' },
];

const products = [
  {
    id: 'velocity-mask',
    name: 'Velocity Mask',
    color: 'Baltic Blue',
    price: 74,
    badge: 'Best seller',
    description: 'Wide ski-goggle vision, locking suction seal, attached swim cap, and a corner lap stopwatch.',
    category: 'Training',
    options: [
      { name: 'Baltic Blue', hex: '#38618C' },
      { name: 'Arctic White', hex: '#E9F4FF' },
      { name: 'Midnight Black', hex: '#0F1528' },
    ],
  },
  {
    id: 'velocity-pro',
    name: 'Velocity Pro Kit',
    color: 'Cool Sky',
    price: 112,
    badge: 'Race kit',
    description: 'Velocity Mask with mirrored lens, spare gasket, hard case, and waterproof charging puck.',
    category: 'Performance',
    options: [
      { name: 'Cool Sky', hex: '#35A7FF' },
      { name: 'Silver Mist', hex: '#D9E4F4' },
      { name: 'Ocean Teal', hex: '#0D6E8D' },
    ],
  },
  {
    id: 'cap-seal-pack',
    name: 'Cap + Seal Pack',
    color: 'Lavender Gray',
    price: 28,
    badge: 'Accessory',
    description: 'Replacement attached cap liner and two soft suction gaskets for high-mileage training.',
    category: 'Accessories',
    options: [
      { name: 'Lavender Gray', hex: '#949EBD' },
      { name: 'Cloud Pink', hex: '#F6D5E8' },
      { name: 'Deep Navy', hex: '#0A123D' },
    ],
  },
  {
    id: 'lap-tracker-band',
    name: 'Lap Tracker Band',
    color: 'Ocean Pearl',
    price: 36,
    badge: 'New',
    description: 'A lightweight wrist band that syncs your splits, pace, and rest intervals to your phone.',
    category: 'Training',
    options: [
      { name: 'Ocean Pearl', hex: '#A7D7EC' },
      { name: 'Coral', hex: '#FF7B7B' },
      { name: 'Graphite', hex: '#2F3347' },
    ],
  },
  {
    id: 'open-water-kit',
    name: 'Open Water Kit',
    color: 'Storm Gray',
    price: 96,
    badge: 'Popular',
    description: 'A travel-ready setup with anti-fog lenses, extra gasket, and secure carry case.',
    category: 'Adventure',
    options: [
      { name: 'Storm Gray', hex: '#7B869D' },
      { name: 'Sunset Orange', hex: '#FF8A5B' },
      { name: 'Emerald', hex: '#1B7A61' },
    ],
  },
  {
    id: 'dry-coat-pack',
    name: 'Dry Coat Pack',
    color: 'Mist White',
    price: 44,
    badge: 'Bundle',
    description: 'A quick-dry towel and storage sleeve designed to keep your gear organized between laps.',
    category: 'Accessories',
    options: [
      { name: 'Mist White', hex: '#F4F7FA' },
      { name: 'Seafoam', hex: '#B7E7D6' },
      { name: 'Slate Blue', hex: '#556C90' },
    ],
  },
];

const features = [
  ['Locking Suction', 'A soft valve seal twists into place and releases cleanly after a swim.'],
  ['Easy Fitting', 'A flexible frame self-centers with a single pull tab and hair-safe cap edge.'],
  ['Attached Swim Cap', 'The cap and mask go on together for a smoother profile and less setup time.'],
  ['Lap Stopwatch', 'A small corner display tracks interval time without blocking the main field of view.'],
];

const team = [
  ['Pradyumna Naresh Iytha', 'Marketing and Pitch Design', 'Crafts the brand story, product copy, and investor decks with a focus on clarity and impact.'],
  ['Sourya Mukalla', 'Web Design and Development', 'Codes the website, online store, and customer accounts with a focus on clarity and performance.'],
  ['Laasya Bollempalli', 'R&D and Prototyping and Testing', 'Leads product development, testing, and iteration with a focus on real-world performance and reliability.'],
  ['Saanvi Goudar', 'Business Operations', 'Manages supply chain, customer support, and day-to-day operations with a focus on efficiency and care.'],
];

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

const accountStorageKey = 'simplicity-user-accounts';

function getStoredAccounts() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(accountStorageKey) || '[]');
  } catch {
    return [];
  }
}

function saveStoredAccounts(accounts) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(accountStorageKey, JSON.stringify(accounts));
  }
}

function useHashRoute() {
  const getRoute = () => window.location.hash.replace('#/', '') || 'home';
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (nextRoute) => {
    window.location.hash = `/${nextRoute}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return [route, navigate];
}

function SkiGoggleViewer() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 1000);
    camera.position.set(0, 0.35, 5.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;

    const model = new THREE.Group();
    model.rotation.set(-0.08, -0.18, -0.03);
    scene.add(model);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.9;
    controls.minPolarAngle = Math.PI * 0.28;
    controls.maxPolarAngle = Math.PI * 0.68;

    const loader = new GLTFLoader();
    loader.load(skiGogglesModelUrl, (gltf) => {
      const loadedScene = gltf.scene;
      loadedScene.traverse((object) => {
        if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;
        if (object.material) object.material.needsUpdate = true;
      });

      const box = new THREE.Box3().setFromObject(loadedScene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const largestAxis = Math.max(size.x, size.y, size.z) || 1;
      const scale = 4.55 / largestAxis;

      loadedScene.position.sub(center);
      loadedScene.scale.setScalar(scale);
      loadedScene.rotation.set(0, Math.PI, 0);
      model.add(loadedScene);

      const fittedBox = new THREE.Box3().setFromObject(model);
      const fittedSphere = fittedBox.getBoundingSphere(new THREE.Sphere());
      const fov = THREE.MathUtils.degToRad(camera.fov);
      const distance = (fittedSphere.radius / Math.sin(fov / 2)) * 0.92;

      controls.target.copy(fittedSphere.center);
      camera.position.set(
        fittedSphere.center.x,
        fittedSphere.center.y + fittedSphere.radius * 0.16,
        fittedSphere.center.z + distance,
      );
      camera.near = Math.max(distance / 100, 0.01);
      camera.far = distance * 100;
      camera.updateProjectionMatrix();
      controls.update();
    });

    scene.add(new THREE.HemisphereLight('#f6fbff', '#06101f', 1.8));

    const keyLight = new THREE.DirectionalLight('#f6fbff', 4.4);
    keyLight.position.set(4.8, 5.6, 6.5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#43b8ff', 3.2);
    rimLight.position.set(-4.8, 2.2, 3.4);
    scene.add(rimLight);

    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    let frameId = 0;
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      renderer.dispose();
      environment.dispose();
      pmremGenerator.dispose();
      scene.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (material.map) material.map.dispose();
          material.dispose();
        });
      });
    };
  }, []);

  return <div className="model-canvas" ref={mountRef} aria-hidden="true" />;
}

function Header({ activeRoute, cartCount, navigate }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="brand" type="button" onClick={() => navigate('home')} aria-label="Simplicity home">
          <img className="brand-mark" src="/icons.svg" alt="" aria-hidden="true" />
          <span>Simplicity</span>
        </button>

        <div className="header-search">
          <span className="search-icon">⌕</span>
          <span>Search gear, accessories, and collections</span>
        </div>

        <nav className="nav-links" aria-label="Main navigation">
          {routes.map((item) => (
            <button
              className={activeRoute === item.id ? 'active' : ''}
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <button className="cart-button" type="button" onClick={() => navigate('buy')}>
            <span className="cart-icon">🛒</span>
            <span>Cart</span>
            <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function ProductStage({ compact = false }) {
  return (
    <div className={compact ? 'product-stage compact' : 'product-stage'}>
      <div className="speed-lines" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="viewer-ring" aria-hidden="true" />
      <SkiGoggleViewer />
      <div className="product-shadow" aria-hidden="true" />
      <p className="viewer-hint">Drag to rotate</p>
    </div>
  );
}

function HomePage({ navigate, addToCart }) {
  return (
    <>
      <section className="hero-section">
        <div className="water-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">Ski-goggle inspired swim vision</p>
          <h1>Simplicity</h1>
          <h2>Simply see, simply swim</h2>
          <h3 className="hero-text">
            A wide-vision swim mask with a locking suction seal, attached cap, easy-fit frame,
            and a corner lap stopwatch so every lap feels calmer, clearer, and faster.
          </h3>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={() => addToCart(products[0])}>
              Add Velocity Mask
            </button>
            <button className="secondary-button" type="button" onClick={() => navigate('product')}>
              Explore Product
            </button>
          </div>
        </div>
        <ProductStage />
      </section>

      <section className="stats-band" aria-label="Product highlights">
        <div>
          <strong>210 deg</strong>
          <span>wide mask view</span>
        </div>
        <div>
          <strong>1 pull</strong>
          <span>easy fit system</span>
        </div>
        <div>
          <strong>01:24</strong>
          <span>corner lap display</span>
        </div>
      </section>

      <FeatureSection />
    </>
  );
}

function FeatureSection() {
  return (
    <section className="feature-section">
      <div className="section-heading">
        <p className="eyebrow">Built for the waterline</p>
        <h2>Ski-goggle coverage, swim-mask seal, race-day simplicity.</h2>
      </div>
      <div className="feature-grid">
        {features.map(([title, text], index) => (
          <article className="feature-card" key={title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MissionPage() {
  return (
    <section className="content-page split-page">
      <div>
        <p className="eyebrow">Mission statement</p>
        <h1>Make every swim feel smoother, safer, and more focused.</h1>
      </div>
      <div className="statement-panel">
        <p>
         We help swimmers solve their inconveniences with swimming goggles by offering a set of swimming goggles that are able to solve many of their common problems.
        </p>
        <p>
          We design products that help swimmers move from warm-up to race pace with confidence.
          Every detail is chosen to be easy to fit, comfortable to wear, and dependable from the
          first dive to the final cooldown.
        </p>
        <div className="mission-points">
          <span>Clear visibility</span>
          <span>Fast, secure fit</span>
          <span>Built for real training</span>
        </div>
      </div>
    </section>
  );
}

function TeamPage() {
  return (
    <section className="content-page">
      <div className="section-heading">
        <p className="eyebrow">Meet the team</p>
        <h1>Designed by swimmers, makers, and operations people who like details.</h1>
      </div>
      <div className="team-grid">
        {team.map(([name, role, bio]) => (
          <article className="team-card" key={name}>
            <div className="avatar" aria-hidden="true">{name.split(' ').map((part) => part[0]).join('')}</div>
            <p>{role}</p>
            <h2>{name}</h2>
            <span>{bio}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductPage({ navigate, addToCart }) {
  return (
    <>
      <section className="content-page product-detail">
        <div className="product-copy">
          <p className="eyebrow">Product page</p>
          <h1>Velocity Mask</h1>
          <p>
            A realistic swim mask concept built around comfort, visibility, and quick setup.
            The wide visor helps with sighting, while the soft gasket and cap-integrated fit
            keep the mask stable through starts, turns, and open-water chop.
          </p>
          <div className="spec-grid">
            <span>Anti-fog coated visor</span>
            <span>USB charging clip</span>
            <span>Replaceable gasket</span>
            <span>One-year warranty</span>
          </div>
          <div className="hero-actions">
            <button class="align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none rounded-full" type="button" onClick={() => navigate('buy')}>
              Add Velocity Mask
            </button>
            <button class="align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none rounded-full" type="button" onClick={() => navigate('buy')}>
              Explore Product
            </button>
          </div>
        </div>
        <ProductStage compact />
      </section>

      <section className="feature-section">
        <div className="section-heading">
          <p className="eyebrow">Featured collection</p>
          <h2>More gear for pool days, open-water sessions, and recovery.</h2>
        </div>
        <div className="catalog-grid product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-swatch" aria-hidden="true" />
              <p>{product.badge}</p>
              <h2>{product.name}</h2>
              <span>{product.category}</span>
              <span>{product.description}</span>
              <strong>{formatCurrency(product.price)}</strong>
              <div className="product-card-actions">
                <button className="primary-button" type="button" onClick={() => addToCart(product)}>
                  Add to Cart
                </button>
                <button className="secondary-button" type="button" onClick={() => navigate(`product/${product.id}`)}>
                  View Details
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <FeatureSection />
    </>
  );
}

function LoginPage({ navigate }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [feedback, setFeedback] = useState('');

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const enteredEmail = form.email.trim().toLowerCase();
    const enteredPassword = form.password;
    const allAccounts = [...credentialsData, ...getStoredAccounts()];

    const matchedAccount = allAccounts.find(
      (account) => account.email.toLowerCase() === enteredEmail && account.password === enteredPassword,
    );

    if (!matchedAccount) {
      setFeedback('Email or password is incorrect.');
      return;
    }

    setFeedback(`Welcome back, ${matchedAccount.name}!`);
    navigate('home');
  };

  return (
    <section className="content-page login-shell">
      <div className="login-card">
        <p className="eyebrow">Account</p>
        <h1>Welcome back</h1>
        <p className="login-copy">Sign in to track orders, save favorites, and continue checkout faster.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" placeholder="you@example.com" value={form.email} onChange={handleChange('email')} />
          </label>
          <label>
            Password
            <input type="password" placeholder="••••••••" value={form.password} onChange={handleChange('password')} />
          </label>
          <button className="primary-button" type="submit">Sign in</button>
        </form>
        {feedback ? <p className="order-success">{feedback}</p> : null}
        <p className="login-footer">
          New here? <button type="button" onClick={() => navigate('signup')}>Create an account</button>
        </p>
      </div>
    </section>
  );
}

function SignupPage({ navigate }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [feedback, setFeedback] = useState('');

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim().toLowerCase();
    const trimmedPassword = form.password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      setFeedback('Please complete all fields.');
      return;
    }

    const allAccounts = [...credentialsData, ...getStoredAccounts()];
    const emailAlreadyExists = allAccounts.some(
      (account) => account.email.toLowerCase() === trimmedEmail,
    );

    if (emailAlreadyExists) {
      setFeedback('An account with that email already exists.');
      return;
    }

    const newAccount = {
      name: trimmedName,
      email: trimmedEmail,
      password: trimmedPassword,
    };

    const updatedAccounts = [...getStoredAccounts(), newAccount];
    saveStoredAccounts(updatedAccounts);
    setForm({ name: '', email: '', password: '' });
    setFeedback('Account created successfully. You can sign in now.');
  };

  return (
    <section className="content-page login-shell">
      <div className="login-card">
        <p className="eyebrow">Create account</p>
        <h1>Join Simplicity</h1>
        <p className="login-copy">Create your account to save gear, manage orders, and speed up checkout.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input type="text" placeholder="Your name" value={form.name} onChange={handleChange('name')} />
          </label>
          <label>
            Email
            <input type="email" placeholder="you@example.com" value={form.email} onChange={handleChange('email')} />
          </label>
          <label>
            Password
            <input type="password" placeholder="Create a password" value={form.password} onChange={handleChange('password')} />
          </label>
          <button className="primary-button" type="submit">Create account</button>
        </form>
        {feedback ? <p className="order-success">{feedback}</p> : null}
        <p className="login-footer">
          Already have an account? <button type="button" onClick={() => navigate('login')}>Sign in</button>
        </p>
      </div>
    </section>
  );
}

function ProductDetailPage({ productId, addToCart, navigate }) {
  const product = products.find((item) => item.id === productId);
  const [selectedColor, setSelectedColor] = useState(product?.options?.[0] || { name: product?.color || 'Default', hex: '#35A7FF' });

  useEffect(() => {
    if (product?.options?.length) {
      setSelectedColor(product.options[0]);
    }
  }, [product]);

  if (!product) {
    return (
      <section className="content-page">
        <p className="eyebrow">Product</p>
        <h1>Product not found</h1>
      </section>
    );
  }

  return (
    <section className="content-page product-detail-page">
      <div className="detail-preview">
        <div className="detail-preview-swatch" style={{ background: `linear-gradient(135deg, ${selectedColor.hex}, #0A123D)` }} />
        <div className="detail-preview-card">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="detail-price-row">
            <strong>{formatCurrency(product.price)}</strong>
            <span>{product.badge}</span>
          </div>
        </div>
      </div>

      <div className="detail-panel">
        <p className="eyebrow">Customize</p>
        <h2>Choose your color</h2>
        <div className="product-color-options">
          {product.options.map((option) => (
            <button
              type="button"
              key={option.name}
              className={selectedColor.name === option.name ? 'color-option active' : 'color-option'}
              onClick={() => setSelectedColor(option)}
            >
              <span style={{ background: option.hex }} />
              {option.name}
            </button>
          ))}
        </div>
        <div className="detail-specs">
          <span>Anti-fog lens</span>
          <span>Easy fit system</span>
          <span>1-year support</span>
        </div>
        <div className="hero-actions">
          <button className="primary-button" type="button" onClick={() => addToCart({ ...product, color: selectedColor.name })}>
            Add {selectedColor.name} to Cart
          </button>
          <button className="secondary-button" type="button" onClick={() => navigate('buy')}>
            Go to Cart
          </button>
        </div>
      </div>
    </section>
  );
}

function ContactPage() {
  return (
    <section className="content-page contact-layout">
      <div>
        <p className="eyebrow">Contact us</p>
        <h1>Questions, partnerships, support, and team orders.</h1>
        <div className="contact-list">
          <p><strong>Email</strong> hello@simplicity.example</p>
          <p><strong>Phone</strong> (555) 014-2088</p>
          <p><strong>Hours</strong> Monday to Friday, 9 AM to 5 PM ET</p>
          <p><strong>Location</strong> 82 Harbor Lane, Austin, TX</p>
        </div>
      </div>
      <form className="contact-form">
        <label>
          Name
          <input type="text" placeholder="Your name" />
        </label>
        <label>
          Email
          <input type="email" placeholder="you@example.com" />
        </label>
        <label>
          Subject
          <input type="text" placeholder="How can we help?" />
        </label>
        <label>
          Message
          <textarea placeholder="Tell us what you need" rows="5" />
        </label>
        <button className="primary-button" type="submit">Send Message</button>
      </form>
    </section>
  );
}
function CheckoutPage({ cart, subtotal, navigate, onPlaceOrder, orderMessage }) {
  const shipping = cart.length ? 7 : 0;
  const tax = subtotal * 0.0825;
  const total = subtotal + shipping + tax;

  return (
    <section className="content-page checkout-screen">
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={onPlaceOrder}>
          <p className="eyebrow">Checkout page</p>
          <h1>Secure checkout</h1>
          <div className="form-grid">
            <label>
              Email
              <input type="email" placeholder="you@example.com" />
            </label>
            <label>
              Full name
              <input type="text" placeholder="Full name" />
            </label>
            <label className="full">
              Address
              <input type="text" placeholder="Street address" />
            </label>
            <label>
              City
              <input type="text" placeholder="City" />
            </label>
            <label>
              ZIP code
              <input type="text" placeholder="ZIP" />
            </label>
            <label className="full">
              Card number
              <input inputMode="numeric" placeholder="4242 4242 4242 4242" />
            </label>
            <label>
              Expiration
              <input placeholder="MM / YY" />
            </label>
            <label>
              CVC
              <input inputMode="numeric" placeholder="123" />
            </label>
          </div>
          <button className="primary-button" type="submit" disabled={!cart.length}>
            Place Order
          </button>
          {orderMessage ? <p className="order-success">{orderMessage}</p> : null}
        </form>

        <aside className="order-summary">
          <h2>Order summary</h2>
          {cart.length === 0 ? (
            <>
              <p className="empty-cart">Your cart is empty.</p>
              <button className="secondary-button" type="button" onClick={() => navigate('buy')}>Return to Buy Page</button>
            </>
          ) : (
            <>
              {cart.map((item) => (
                <p key={item.id}>
                  <span>{item.name} x {item.quantity}</span>
                  <strong>{formatCurrency(item.price * item.quantity)}</strong>
                </p>
              ))}
              <p><span>Shipping</span><strong>{formatCurrency(shipping)}</strong></p>
              <p><span>Estimated tax</span><strong>{formatCurrency(tax)}</strong></p>
              <p className="grand-total"><span>Total</span><strong>{formatCurrency(total)}</strong></p>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

function App() {
  const [route, navigate] = useHashRoute();
  const [cart, setCart] = useState([]);
  const [orderMessage, setOrderMessage] = useState('');

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => (
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    setCart((current) => (
      current
        .map((item) => (item.id === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    ));
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const handlePlaceOrder = (event) => {
    event.preventDefault();

    if (!cart.length) {
      return;
    }

    setOrderMessage('Thanks for your order — a confirmation email is on its way.');
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isProductDetailRoute = route.startsWith('product/');
  const activeRoute = route === 'checkout' || route === 'login' || route === 'signup'
    ? route
    : isProductDetailRoute
      ? 'product'
      : routes.some((item) => item.id === route)
        ? route
        : 'home';

  return (
    <main className="page-shell">
      <Header activeRoute={activeRoute} cartCount={cartCount} navigate={navigate} />
      {activeRoute === 'home' && <HomePage navigate={navigate} addToCart={addToCart} />}
      {activeRoute === 'mission' && <MissionPage />}
      {activeRoute === 'team' && <TeamPage />}
      {isProductDetailRoute ? (
        <ProductDetailPage
          productId={route.split('/')[1]}
          addToCart={addToCart}
          navigate={navigate}
        />
      ) : activeRoute === 'product' ? (
        <ProductPage navigate={navigate} addToCart={addToCart} />
      ) : null}
      {activeRoute === 'contact' && <ContactPage />}
      {activeRoute === 'login' && <LoginPage navigate={navigate} />}
      {activeRoute === 'signup' && <SignupPage navigate={navigate} />}
      {activeRoute === 'buy' && (
        <BuyPage
          cart={cart}
          addToCart={addToCart}
          updateQuantity={updateQuantity}
          navigate={navigate}
          subtotal={subtotal}
        />
      )}
      {activeRoute === 'checkout' && (
        <CheckoutPage
          cart={cart}
          subtotal={subtotal}
          navigate={navigate}
          onPlaceOrder={handlePlaceOrder}
          orderMessage={orderMessage}
        />
      )}
    </main>
  );
}

export default App;
