import type { Metadata } from 'next';
import { ReleasesPage, releasesMetadata } from '@/components/releases/releases-page';
import { PROJECTS, type ProjectId } from '@/lib/release-projects';

/** The opentide package has /releases/ itself; every other project gets a page here. */
const PROJECT_IDS = PROJECTS.map((project) => project.id).filter((id) => id !== 'opentide');

export const dynamicParams = false;

export function generateStaticParams() {
  return PROJECT_IDS.map((project) => ({ project }));
}

function projectId(value: string): ProjectId {
  const id = PROJECT_IDS.find((candidate) => candidate === value);
  if (!id) throw new Error(`Unknown release project: ${value}`);
  return id;
}

export async function generateMetadata({ params }: PageProps<'/releases/[project]'>): Promise<Metadata> {
  const { project } = await params;
  return releasesMetadata(projectId(project));
}

export default async function ProjectReleasesPage({ params }: PageProps<'/releases/[project]'>) {
  const { project } = await params;
  return <ReleasesPage id={projectId(project)} />;
}
