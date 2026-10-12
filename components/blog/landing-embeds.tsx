import { AgentNeeds as AgentNeedsTable } from '@/components/landing/agent-contract';
import { NorthStar as NorthStarTrack } from '@/components/landing/north-star';
import { SpecLayers as SpecLayerStack } from '@/components/landing/spec-layers';
import { Roadmap as RoadmapColumns } from '@/components/landing/what-comes-next';

/**
 * Landing visuals reused in blog posts, passed to the MDX renderer by the blog page only: blog
 * pages render inside the landing chrome, so the landing tokens resolve there and nowhere else.
 * `not-prose` keeps the article typography off their tables and lists.
 */
export function NorthStar() {
  return (
    <div className="not-prose my-10">
      <NorthStarTrack />
    </div>
  );
}

export function Roadmap() {
  return (
    <div className="not-prose my-10">
      <RoadmapColumns />
    </div>
  );
}

export function AgentNeeds() {
  return (
    <div className="not-prose my-10">
      <AgentNeedsTable />
    </div>
  );
}

export function SpecLayers() {
  return (
    <div className="not-prose my-10">
      <SpecLayerStack />
    </div>
  );
}
