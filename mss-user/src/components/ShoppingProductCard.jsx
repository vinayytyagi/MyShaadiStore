import Link from "next/link";
import { getItemImage, truncateText } from "@/lib/shopUi";

export default function ShoppingProductCard({ item, index = 0, badge, compact = false }) {
  const image = getItemImage(item, index);

  return (
    <article className="group overflow-hidden rounded-3xl border border-[#ead3db] bg-[#f1dfe6] transition hover:-translate-y-0.5">
      <Link href={`/shopping/${item.item_id}`} className="block cursor-pointer">
        <div className={`relative overflow-hidden bg-[#f7e9ee] ${compact ? "h-44" : "h-52"}`}>
          <div
            className="h-full w-full bg-contain bg-center bg-no-repeat transition duration-300 group-hover:scale-105"
            style={{ backgroundImage: `url("${image}")` }}
            role="img"
            aria-label={item.name}
          />
        </div>

        <div className="space-y-2 bg-[#edd2dc] px-4 py-3">
          <h3 className="text-[30px] leading-none font-semibold text-[#7b1535]">{item.name}</h3>
          <p className="text-sm leading-5 text-[#9a3b59]">{truncateText(item.description || "Curated wedding essential.", 60)}</p>
          {badge ? <p className="text-xs font-medium text-[#7b1535]/80">{badge}</p> : null}
        </div>
      </Link>
    </article>
  );
}
