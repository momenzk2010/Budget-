// Vercel Serverless Function — وسيط بين التطبيق و Open Food Facts.
// يشتغل على السيرفر (مو على متصفح المستخدم)، فبيقدر يرسل User-Agent
// صحيح متل ما توثيق Open Food Facts يطلب، وهذا يقلل رفض/فشل الطلبات
// اللي بتصير لما المتصفح يتصل مباشرة (المتصفح ما يسمح بتغيير User-Agent أصلاً).

export default async function handler(req, res) {
  const { barcode } = req.query;

  if (!barcode || !/^\d{4,14}$/.test(String(barcode))) {
    return res.status(400).json({ status: 0, error: "invalid-barcode" });
  }

  const url =
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json` +
    `?fields=product_name,product_name_ar,brands,quantity,categories,image_front_small_url,status`;

  try {
    const upstream = await fetch(url, {
      headers: {
        // غيّرها لاسم تطبيقك وإيميلك — Open Food Facts بيطلبوا هالشي
        // عشان ما يصنّفوك كبوت ويحظروا الطلبات.
        "User-Agent": "MizaniyatiApp/1.0 (contact: https://github.com/momenzk2010/Budget)",
      },
    });

    const data = await upstream.json();
    // بنمرر نفس status code والبيانات متل ما إجت من Open Food Facts
    res.status(upstream.status).json(data);
  } catch (e) {
    console.error("OFF proxy failed:", e);
    res.status(502).json({ status: 0, error: "upstream-unreachable" });
  }
}
