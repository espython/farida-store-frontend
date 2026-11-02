#!/bin/sh
# Seeds the promotions (W7) with the storefront's mock content: 4 hero banners per
# language (SVGs from mock/.cache/banners, see the mock README), 3 announcement-bar
# messages and 2 category mini-ads per language. Runs inside the wpcli container
# after setup.sh. Skips if any promotion exists (delete them to re-seed).
#   docker compose --profile tools run --rm wpcli sh /seed-content.sh
set -eu

if [ "$(wp post list --post_type=farida_promo --post_status=any --format=count)" != "0" ]; then
  echo "Promotions exist; nothing seeded."
  exit 0
fi

promo() { # placement lang order title [link]
  id=$(wp post create --post_type=farida_promo --post_status=publish --menu_order="$3" --post_title="$4" --porcelain)
  wp post meta update "$id" _farida_placement "$1" >/dev/null
  wp post meta update "$id" _farida_lang "$2" >/dev/null
  [ -n "${5:-}" ] && wp post meta update "$id" _farida_link "$5" >/dev/null
  echo "$id"
}

# The title is the banner's text alternative: what the artwork says.
title() { # n lang
  case "$1-$2" in
    1-en) echo "Kitchen Week: up to 20% off blenders and juicers" ;;
    1-ar) echo "أسبوع المطبخ: خصم حتى 20% على الخلاطات والعصارات" ;;
    2-en) echo "New arrival: Orbit Barista espresso machine" ;;
    2-ar) echo "وصل حديثاً: ماكينة إسبريسو أوربت باريستا" ;;
    3-en) echo "Cookware: pots and pans from 890 EGP" ;;
    3-ar) echo "أدوات الطهي: حلل وطاسات تبدأ من ٨٩٠ جنيه" ;;
    4-en) echo "Free delivery in Cairo and Giza on orders over 2,000 EGP" ;;
    4-ar) echo "توصيل مجاني للقاهرة والجيزة للطلبات فوق ٢٬٠٠٠ جنيه" ;;
  esac
}

i=1
for link in /categories/blenders /categories/espresso-machines /categories/cookware /products; do
  for lang in en ar; do
    file="/mock-cache/banners/$lang-$i.svg"
    if [ -f "$file" ]; then
      id=$(promo hero "$lang" "$i" "$(title "$i" "$lang")" "$link")
      att=$(wp media import "$file" --post_id="$id" --featured_image --title="Banner $i ($lang)" --porcelain)
      # WordPress cannot measure SVGs; the mock banners are 1600x900.
      wp post meta update "$att" _wp_attachment_metadata '{"width":1600,"height":900,"file":"'"$(wp post meta get "$att" _wp_attached_file)"'"}' --format=json >/dev/null
    else
      echo "WARN: $file missing (run the mock banners script); hero $i ($lang) not seeded."
    fi
  done
  i=$((i + 1))
done

promo announcement en 1 "Free delivery in Cairo & Giza on orders over 2,000 EGP" >/dev/null
promo announcement en 2 "Pay cash on delivery" >/dev/null
promo announcement en 3 "2-year warranty on every appliance" >/dev/null
promo announcement ar 1 "توصيل مجاني للقاهرة والجيزة للطلبات فوق ٢٬٠٠٠ جنيه" >/dev/null
promo announcement ar 2 "ادفع عند الاستلام" >/dev/null
promo announcement ar 3 "ضمان سنتين على جميع الأجهزة" >/dev/null
promo mini en 1 "New cookware sets just arrived" /categories/cookware >/dev/null
promo mini en 2 "Weekend deals on coffee machines" >/dev/null
promo mini ar 1 "وصلت أطقم حلل جديدة" /categories/cookware >/dev/null
promo mini ar 2 "عروض نهاية الأسبوع على ماكينات القهوة" >/dev/null

echo "Seeded $(wp post list --post_type=farida_promo --format=count) promotions."
