import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getQuotationRequestsCollection } from "@/lib/db";

export async function GET(request) {
  const err = requireAdmin(request);
  if (err) return err;

  try {
    const { searchParams } = new URL(request.url);
    const emailStatus = searchParams.get("email_status");
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;

    const col = await getQuotationRequestsCollection();
    const filter = emailStatus ? { email_status: emailStatus } : {};
    const total = await col.countDocuments(filter);
    const skip = (page - 1) * limit;
    const requests = await col.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).toArray();

    return NextResponse.json({
      requests: requests.map((requestItem) => ({
        ...requestItem,
        quotation_request_id: requestItem._id.toString(),
      })),
      total,
      page,
      limit,
    });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
