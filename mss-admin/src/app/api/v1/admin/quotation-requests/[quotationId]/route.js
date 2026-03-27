import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { getQuotationRequestsCollection } from "@/lib/db";

export async function GET(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;

  try {
    const { quotationId } = await params;
    if (!ObjectId.isValid(quotationId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Quotation request not found" }, { status: 404 });
    }

    const col = await getQuotationRequestsCollection();
    const requestItem = await col.findOne({ _id: new ObjectId(quotationId) });
    if (!requestItem) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Quotation request not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...requestItem,
      quotation_request_id: requestItem._id.toString(),
    });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
