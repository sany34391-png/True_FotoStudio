import DimensionFOTO from "../components/BuyFoto/dimensionsFOTO";
import Order from "../components/BuyFoto/order";
import Catalog from "../components/BuyFoto/catalog";

export default function BuyFoto() {
  return (
    <div>
      <Order />
      <DimensionFOTO />
      <Catalog />
    </div>
  );
}