import { redirect } from "@/navigation";

// There is nothing to show without an order number (this rendered a blank
// page); send people to the lookup form.
const TrackOrderPage = () => {
  redirect("/order");
};

export default TrackOrderPage;
