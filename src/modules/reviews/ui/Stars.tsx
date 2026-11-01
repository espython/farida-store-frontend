import { FaRegStar, FaStar } from "react-icons/fa";

/** A review's whole-star rating, saffron like the product rating. Decorative: the caller labels it. */
const Stars = ({ rating, className = "" }: { rating: number; className?: string }) => (
  <span aria-hidden="true" className={`flex gap-0.5 text-saffron ${className}`}>
    {[1, 2, 3, 4, 5].map((n) => (n <= rating ? <FaStar key={n} /> : <FaRegStar key={n} className="text-[#dcdacb]" />))}
  </span>
);

export default Stars;
