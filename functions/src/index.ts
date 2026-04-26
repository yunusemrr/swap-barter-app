import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import axios from 'axios';

admin.initializeApp();
const db = admin.firestore();

const PAYTR_API_URL = 'https://www.paytr.com/odeme/api/get-token';
const MERCHANT_ID   = process.env.PAYTR_MERCHANT_ID  ?? '';
const MERCHANT_KEY  = process.env.PAYTR_MERCHANT_KEY  ?? '';
const MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT ?? '';

// Callback URLs — Firebase Functions public URLs
const FUNCTIONS_BASE = `https://us-central1-swap-barter2.cloudfunctions.net`;

function setCors(res: functions.Response) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ─── 1. Token oluştur ────────────────────────────────────────────────────────
export const createBoostToken = functions.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST')    { res.status(405).send('Method Not Allowed'); return; }

  const { productId, userId, userEmail, userName } = req.body as {
    productId: string;
    userId: string;
    userEmail: string;
    userName: string;
  };

  if (!productId || !userId || !userEmail) {
    res.status(400).json({ success: false, error: 'Eksik parametre' });
    return;
  }

  // Kullanıcının gerçek IP'si (Firebase Functions headers üzerinden)
  const userIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '1.2.3.4';

  const merchantOid   = `boost_${productId}_${Date.now()}`;
  const paymentAmount = 15000; // 150 TL → kuruş
  const currency      = 'TL';
  const testMode      = '1'; // CANLIYA GEÇERKEN: '0'

  const basket = JSON.stringify([['7 Günlük Öne Çıkarma Paketi', '150.00', 1]]);
  const basketB64 = Buffer.from(basket).toString('base64');

  const noInstallment  = '1';
  const maxInstallment = '0';

  // Hash hesapla
  const hashStr =
    MERCHANT_ID + userIp + merchantOid + userEmail +
    paymentAmount + basketB64 + noInstallment + maxInstallment + currency + testMode;

  const paytrToken = crypto
    .createHmac('sha256', MERCHANT_KEY)
    .update(hashStr + MERCHANT_SALT)
    .digest('base64');

  const params = new URLSearchParams({
    merchant_id:      MERCHANT_ID,
    user_ip:          userIp,
    merchant_oid:     merchantOid,
    email:            userEmail,
    payment_amount:   paymentAmount.toString(),
    paytr_token:      paytrToken,
    user_basket:      basketB64,
    debug_on:         '1',
    no_installment:   noInstallment,
    max_installment:  maxInstallment,
    user_name:        userName || 'Kullanıcı',
    user_address:     'Türkiye',
    user_phone:       '05000000000',
    merchant_ok_url:  `${FUNCTIONS_BASE}/paytrSuccess?productId=${productId}&userId=${userId}&oid=${merchantOid}`,
    merchant_fail_url:`${FUNCTIONS_BASE}/paytrFail?oid=${merchantOid}`,
    currency,
    test_mode:        testMode,
    lang:             'tr',
  });

  try {
    const response = await axios.post(PAYTR_API_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    });

    if (response.data.status !== 'success') {
      functions.logger.error('PayTR token hatası', response.data);
      res.status(400).json({ success: false, error: response.data.reason ?? 'Token alınamadı' });
      return;
    }

    // Bekleyen sipariş kaydı oluştur
    await db.collection('boostOrders').doc(merchantOid).set({
      productId, userId, merchantOid,
      status: 'pending',
      amount: 150,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, token: response.data.token, merchantOid });
  } catch (err) {
    functions.logger.error('createBoostToken hatası', err);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

// ─── 2. Başarılı ödeme callback ──────────────────────────────────────────────
export const paytrSuccess = functions.https.onRequest(async (req, res) => {
  const {
    merchant_oid, status, total_amount, hash,
  } = req.body as Record<string, string>;

  const { productId, userId, oid } = req.query as Record<string, string>;

  // Hash doğrulama
  const expected = crypto
    .createHmac('sha256', MERCHANT_KEY)
    .update(merchant_oid + MERCHANT_SALT + status + total_amount)
    .digest('base64');

  if (hash !== expected) {
    functions.logger.warn('PayTR hash uyuşmadı', { merchant_oid, hash, expected });
    res.send('PAYTR_HASH_MISMATCH');
    return;
  }

  if (status === 'success') {
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + 7);

    const batch = db.batch();

    // Ürünü öne çıkar
    batch.update(db.collection('products').doc(productId), {
      featured: true,
      featuredUntil,
      featuredCity: null,
    });

    // Sipariş durumunu güncelle
    batch.update(db.collection('boostOrders').doc(oid || merchant_oid), {
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();
    functions.logger.info('Boost tamamlandı', { productId, userId, merchant_oid });
  }

  // PayTR "OK" yanıtı bekliyor
  res.send('OK');
});

// ─── 3. Başarısız ödeme callback ─────────────────────────────────────────────
export const paytrFail = functions.https.onRequest(async (req, res) => {
  const { oid } = req.query as Record<string, string>;
  if (oid) {
    await db.collection('boostOrders').doc(oid).update({ status: 'failed' }).catch(() => {});
  }
  res.send('OK');
});
