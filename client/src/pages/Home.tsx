import Advantages from "../components/Home/Advantages";
import CatalogPreview from "../components/Home/CatalogPreview";
import Hero from "../components/Home/Hero"; 
import HowItWorks from "../components/Home/HowItWorks";
import OrderCta from "../components/Home/OrderCta";
import PortfolioPreview from "../components/Home/PortfolioPreview";
import ReviewsPreview from "../components/Home/ReviewsPreview";


export default function Home() {
  return (
    <div>
      <Hero />
      <Advantages />
      <HowItWorks />
      <CatalogPreview />
      <ReviewsPreview />
      <PortfolioPreview />
      <OrderCta />
    </div>
  );
}