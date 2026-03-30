import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { getQuotationRequestsCollection } from "@/lib/db";
import { escapeRegex, parsePagination, parseSort } from "@/lib/adminListQuery";

const QUOTE_SORT = ["created_at", "updated_at", "email_status"];

export async function GET(request) {
  const err = requireAdmin(request);
  if (err) return err;

  try {
    const { searchParams } = new URL(request.url);
    const emailStatus = searchParams.get("email_status");
    const q = (searchParams.get("q") || searchParams.get("search") || "").trim();
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 25, maxLimit: 200 });
    const { sort } = parseSort(searchParams, QUOTE_SORT, "created_at", "desc");

    const col = await getQuotationRequestsCollection();
    const filter = {};
    if (emailStatus) filter.email_status = emailStatus;
    if (q) {
      const rx = { $regex: escapeRegex(q), $options: "i" };
      const or = [{ "customer.name": rx }, { "customer.phone": rx }, { "customer.email": rx }];
      if (ObjectId.isValid(q) && String(q).length === 24) {
        try {
          or.push({ _id: new ObjectId(q) });
        } catch {
          /* ignore */
        }
      }
      or.push({
        $expr: {
          $regexMatch: { input: { $toString: "$_id" }, regex: escapeRegex(q), options: "i" },
        },
      });
      filter.$or = or;
    }
    const total = await col.countDocuments(filter);
    const requests = await col.find(filter).sort(sort).skip(skip).limit(limit).toArray();

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
