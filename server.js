import 'dotenv/config';
import express from 'express';
import Stripe from 'stripe';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 4242;

const products = new Map([
  ['velocity-mask', { name: 'Velocity Mask', price: 4199 }],
  ['velocity-pro', { name: 'Velocity Pro Kit', price: 11200 }],
  ['cap-seal-pack', { name: 'Cap + Seal Pack', price: 2800 }],
  ['lap-tracker-band', { name: 'Lap Tracker Band', price: 3600 }],
  ['open-water-kit', { name: 'Open Water Kit', price: 9600 }],
  ['dry-coat-pack', { name: 'Dry Coat Pack', price: 4400 }],
]);

app.use(express.json());

app.post('/api/create-checkout-session', async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY.' });
  }

  const cart = Array.isArray(req.body.cart) ? req.body.cart : [];
  const origin = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';

  if (!cart.length) {
    return res.status(400).json({ error: 'Cart is empty.' });
  }

  const lineItems = cart.map((item) => {
    const product = products.get(item.id);
    const quantity = Number.parseInt(item.quantity, 10);

    if (!product || !Number.isInteger(quantity) || quantity < 1) {
      return null;
    }

    return {
      quantity,
      price_data: {
        currency: 'usd',
        product_data: {
          name: product.name,
        },
        unit_amount: product.price,
      },
    };
  });

  if (lineItems.some((item) => item === null)) {
    return res.status(400).json({ error: 'Cart contains an invalid item.' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 700,
              currency: 'usd',
            },
            display_name: 'Standard shipping',
          },
        },
      ],
      success_url: `${origin}/#/checkout?success=true`,
      cancel_url: `${origin}/#/checkout?canceled=true`,
    });

    return res.json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Stripe checkout server listening on http://localhost:${port}`);
});
