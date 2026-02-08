const express = require('express');
const crypto = require('crypto');
const router = express.Router();

router.post('/webhook/nowpayments', express.json({ type: '*/*' }), async (req, res) => {
  try {
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
    const signature = req.headers['x-nowpayments-sig'];

    const payload = JSON.stringify(req.body);
    const hmac = crypto
      .createHmac('sha512', ipnSecret)
      .update(payload)
      .digest('hex');

    if (hmac !== signature) {
      console.log('❌ IPN signature invalid');
      return res.status(401).send('Invalid signature');
    }

    const payment = req.body;

    // ✅ الدفع تم بنجاح
    if (payment.payment_status === 'finished') {
      const uid = payment.order_id; // سنستخدم uid كمُعرف المستخدم

      // هنا فعّل الاشتراك
      await Energy.updateOne(
        { uid },
        { hasFreePass: true }
      );

      console.log('✅ Subscription activated for:', uid);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Webhook error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
