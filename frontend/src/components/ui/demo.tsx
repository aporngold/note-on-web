import GridBloom from "@/components/ui/grid-bloom";

export default function GridBloomDemo() {
  return (
    <div className="relative flex h-[500px] w-full items-center justify-center overflow-hidden rounded-lg bg-background">
      <GridBloom />
      <h1 className="relative z-10 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
        Grid Bloom
      </h1>
    </div>
  );
}
