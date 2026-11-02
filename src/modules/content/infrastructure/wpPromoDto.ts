/** `GET /wp-json/farida/v1/promos?lang=` (infra/wordpress/mu-plugins/farida-content.php). */
export interface WpPromoDto {
  id: number;
  placement: string;
  text: string;
  image: { url: string; width: number | null; height: number | null; alt: string } | null;
  link: string | null;
  order: number;
}
