import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getQuotationRequestsCollection } from "@/lib/db";

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function buildHtml(customer, items, note) {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px;border:1px solid #e5e7eb;">${item.name}</td>
          <td style="padding:10px;border:1px solid #e5e7eb;">${item.journey_title || item.category_label || item.item_type || "-"}</td>
          <td style="padding:10px;border:1px solid #e5e7eb;">${item.subcategory_label || item.location_city || "-"}</td>
          <td style="padding:10px;border:1px solid #e5e7eb;">${Number(item.quantity) || 1}</td>
          <td style="padding:10px;border:1px solid #e5e7eb;">${formatMoney(item.final_price || item.price)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;">
      <h2>New quotation request</h2>
      <p><strong>Name:</strong> ${customer.name}</p>
      <p><strong>Phone:</strong> ${customer.phone}</p>
      <p><strong>Email:</strong> ${customer.email || "-"}</p>
      <p><strong>Note:</strong> ${note || "-"}</p>
      <table style="border-collapse:collapse;width:100%;margin-top:16px;">
        <thead>
          <tr>
            <th style="padding:10px;border:1px solid #e5e7eb;text-align:left;">Item</th>
            <th style="padding:10px;border:1px solid #e5e7eb;text-align:left;">Category</th>
            <th style="padding:10px;border:1px solid #e5e7eb;text-align:left;">Subcategory / Location</th>
            <th style="padding:10px;border:1px solid #e5e7eb;text-align:left;">Qty</th>
            <th style="padding:10px;border:1px solid #e5e7eb;text-align:left;">Price</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

async function sendQuotationMail({ customer, items, note, quotationId }) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.QUOTATION_EMAIL_TO;
  const from = process.env.QUOTATION_EMAIL_FROM || user;

  if (!host || !port || !to || !from) {
    return { sent: false, reason: "smtp_not_configured" };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  await transporter.sendMail({
    from,
    to,
    replyTo: customer.email || undefined,
    subject: `Quotation Request #${quotationId} - ${customer.name}`,
    html: buildHtml(customer, items, note),
    text: [
      `Quotation Request #${quotationId}`,
      `Name: ${customer.name}`,
      `Phone: ${customer.phone}`,
      `Email: ${customer.email || "-"}`,
      `Note: ${note || "-"}`,
      "",
      ...items.map(
        (item) =>
          `- ${item.name} | ${item.journey_title || item.category_label || item.item_type || "-"} | Qty ${Number(item.quantity) || 1} | ${formatMoney(item.final_price || item.price)}`
      ),
    ].join("\n"),
  });

  return { sent: true };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    const customer = body.customer || {};
    const name = String(customer.name || "").trim();
    const phone = String(customer.phone || "").trim();
    const email = String(customer.email || "").trim();
    const note = String(body.note || "").trim();

    if (!name || !phone) {
      return NextResponse.json({ code: "BAD_REQUEST", message: "Customer name and phone are required" }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ code: "BAD_REQUEST", message: "Quotation items are required" }, { status: 400 });
    }

    const quotationCol = await getQuotationRequestsCollection();
    const doc = {
      customer: {
        name,
        phone,
        email: email || null,
      },
      note: note || null,
      items: items.map((item) => ({
        item_id: item.item_id,
        name: item.name,
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        final_price: Number(item.final_price) || Number(item.price) || 0,
        journey_title: item.journey_title || null,
        category_label: item.category_label || null,
        subcategory_label: item.subcategory_label || null,
        item_type: item.item_type || null,
        location_city: item.location_city || null,
      })),
      email_status: "pending",
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await quotationCol.insertOne(doc);
    const quotationId = result.insertedId.toString();

    try {
      const mailResult = await sendQuotationMail({ customer: doc.customer, items: doc.items, note: doc.note, quotationId });
      await quotationCol.updateOne(
        { _id: result.insertedId },
        {
          $set: {
            email_status: mailResult.sent ? "sent" : mailResult.reason,
            updated_at: new Date(),
          },
        }
      );
    } catch (mailError) {
      await quotationCol.updateOne(
        { _id: result.insertedId },
        {
          $set: {
            email_status: "failed",
            email_error: mailError.message,
            updated_at: new Date(),
          },
        }
      );
    }

    return NextResponse.json({
      quotationId,
      message: "Quotation request saved successfully.",
    });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
