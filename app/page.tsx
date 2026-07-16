import GuestPageGate from "../components/GuestPageGate";
import HomeLanding from "../components/HomeLanding";

export default function HomePage() {
  return (
    <GuestPageGate loaderMessage="Checking session...">
      <HomeLanding />
    </GuestPageGate>
  );
}
