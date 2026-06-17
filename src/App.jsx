import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import skiGogglesModelUrl from '../ski_goggles.glb?url';
import './App.css';

const routes = [
  { id: 'home', label: 'Home' },
  { id: 'mission', label: 'Mission' },
  { id: 'team', label: 'Team' },
  { id: 'product', label: 'Product' },
  { id: 'contact', label: 'Contact' },
  { id: 'buy', label: 'Buy' },
];

const products = [
  {
    id: 'velocity-mask',
    name: 'Velocity Mask',
    color: 'Baltic Blue',
    price: 74,
    badge: 'Best seller',
    description: 'Wide ski-goggle vision, locking suction seal, attached swim cap, and a corner lap stopwatch.',
  },
  {
    id: 'velocity-pro',
    name: 'Velocity Pro Kit',
    color: 'Cool Sky',
    price: 112,
    badge: 'Race kit',
    description: 'Velocity Mask with mirrored lens, spare gasket, hard case, and waterproof charging puck.',
  },
  {
    id: 'cap-seal-pack',
    name: 'Cap + Seal Pack',
    color: 'Lavender Gray',
    price: 28,
    badge: 'Accessory',
    description: 'Replacement attached cap liner and two soft suction gaskets for high-mileage training.',
  },
];

const features = [
  ['Locking Suction', 'A soft valve seal twists into place and releases cleanly after a swim.'],
  ['Easy Fitting', 'A flexible frame self-centers with a single pull tab and hair-safe cap edge.'],
  ['Attached Swim Cap', 'The cap and mask go on together for a smoother profile and less setup time.'],
  ['Lap Stopwatch', 'A small corner display tracks interval time without blocking the main field of view.'],
];

const team = [
  ['Maya Iyer', 'Product Design', 'Builds the fit system around real swimmer feedback and fast pool-deck testing.'],
  ['Elliot Chen', 'Hydrodynamics', 'Turns wide-visor ideas into low-drag shapes that still feel comfortable.'],
  ['Nora Brooks', 'Operations', 'Keeps launches, materials, and customer support running with practical precision.'],
];

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
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
      <button className="brand" type="button" onClick={() => navigate('home')} aria-label="Simplicity home">
        <img className="brand-mark" src="/icons.svg" alt="" aria-hidden="true" />
        <span>Simplicity</span>
      </button>
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
      <button className="cart-button" type="button" onClick={() => navigate('buy')}>
        Cart <span>{cartCount}</span>
      </button>
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
          <h1>Simplicity Velocity Mask</h1>
          <p className="hero-text">
            A wide-vision swim mask with a locking suction seal, attached cap, easy-fit frame,
            and a corner lap stopwatch for swimmers who want fewer steps before the water.
          </p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={() => addToCart(products[0])}>
              Add Velocity Mask
            </button>
            <button className="secondary-button" type="button" onClick={() => navigate('product')}>
              View Product
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
        <h1>Make performance swim gear simpler to trust.</h1>
      </div>
      <div className="statement-panel">
        <p>
          Simplicity exists to remove the tiny frictions that keep swimmers from getting into
          rhythm: foggy lenses, fussy straps, loose caps, and devices that demand attention.
        </p>
        <p>
          Our mission is to design gear that feels calm, reliable, and fast from the first lap
          to the last. Every product has to be easy to fit, easy to maintain, and clear in the water.
        </p>
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
            <button className="primary-button" type="button" onClick={() => addToCart(products[0])}>
              Add to Cart
            </button>
            <button className="secondary-button" type="button" onClick={() => navigate('buy')}>
              Buy Page
            </button>
          </div>
        </div>
        <ProductStage compact />
      </section>
      <FeatureSection />
    </>
  );
}

function ContactPage() {
  return (
    <section className="content-page contact-layout">
      <div>
        <p className="eyebrow">Contact us</p>
        <h1>Questions, partnerships, support, and swim-team orders.</h1>
        <div className="contact-list">
          <p><strong>Email</strong> hello@simplicity.example</p>
          <p><strong>Phone</strong> (555) 014-2088</p>
          <p><strong>Hours</strong> Monday to Friday, 9 AM to 5 PM ET</p>
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
          Message
          <textarea placeholder="Tell us what you need" rows="5" />
        </label>
        <button className="primary-button" type="button">Send Message</button>
      </form>
    </section>
  );
}

function BuyPage({ cart, addToCart, updateQuantity, navigate, subtotal }) {
  return (
    <section className="content-page shop-layout">
      <div>
        <p className="eyebrow">Buy page</p>
        <h1>Shop the Velocity collection.</h1>
        <div className="catalog-grid">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-swatch" aria-hidden="true" />
              <p>{product.badge}</p>
              <h2>{product.name}</h2>
              <span>{product.description}</span>
              <strong>{formatCurrency(product.price)}</strong>
              <button className="primary-button" type="button" onClick={() => addToCart(product)}>
                Add to Cart
              </button>
            </article>
          ))}
        </div>
      </div>
      <CartPanel cart={cart} updateQuantity={updateQuantity} navigate={navigate} subtotal={subtotal} />
    </section>
  );
}

function CartPanel({ cart, updateQuantity, navigate, subtotal }) {
  const shipping = cart.length ? 7 : 0;
  const tax = subtotal * 0.0825;
  const total = subtotal + shipping + tax;

  return (
    <aside className="cart-panel">
      <div className="cart-title">
        <h2>Cart</h2>
        <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span>
      </div>
      {cart.length === 0 ? (
        <p className="empty-cart">Your cart is empty. Add a product to start checkout.</p>
      ) : (
        <div className="cart-items">
          {cart.map((item) => (
            <div className="cart-item" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <span>{item.color}</span>
              </div>
              <div className="quantity-control">
                <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name}`}>
                  -
                </button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name}`}>
                  +
                </button>
              </div>
              <strong>{formatCurrency(item.price * item.quantity)}</strong>
            </div>
          ))}
        </div>
      )}
      <div className="totals">
        <p><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></p>
        <p><span>Shipping</span><strong>{formatCurrency(shipping)}</strong></p>
        <p><span>Estimated tax</span><strong>{formatCurrency(tax)}</strong></p>
        <p className="grand-total"><span>Total</span><strong>{formatCurrency(total)}</strong></p>
      </div>
      <button className="primary-button" type="button" disabled={!cart.length} onClick={() => navigate('checkout')}>
        Checkout
      </button>
    </aside>
  );
}

function CheckoutPage({ cart, subtotal, navigate }) {
  const shipping = cart.length ? 7 : 0;
  const tax = subtotal * 0.0825;
  const total = subtotal + shipping + tax;

  return (
    <section className="content-page checkout-layout">
      <form className="checkout-form">
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
        <button className="primary-button" type="button" disabled={!cart.length}>
          Place Order
        </button>
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
    </section>
  );
}

function App() {
  const [route, navigate] = useHashRoute();
  const [cart, setCart] = useState([]);

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

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeRoute = routes.some((item) => item.id === route) || route === 'checkout' ? route : 'home';

  return (
    <main className="page-shell">
      <Header activeRoute={activeRoute} cartCount={cartCount} navigate={navigate} />
      {activeRoute === 'home' && <HomePage navigate={navigate} addToCart={addToCart} />}
      {activeRoute === 'mission' && <MissionPage />}
      {activeRoute === 'team' && <TeamPage />}
      {activeRoute === 'product' && <ProductPage navigate={navigate} addToCart={addToCart} />}
      {activeRoute === 'contact' && <ContactPage />}
      {activeRoute === 'buy' && (
        <BuyPage
          cart={cart}
          addToCart={addToCart}
          updateQuantity={updateQuantity}
          navigate={navigate}
          subtotal={subtotal}
        />
      )}
      {activeRoute === 'checkout' && <CheckoutPage cart={cart} subtotal={subtotal} navigate={navigate} />}
    </main>
  );
}

export default App;
