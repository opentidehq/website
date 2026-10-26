import type { Metadata } from 'next';
import { ReleaseLog } from '@/components/releases/release-log';
import { readBuildTimePypiVersion } from '@/lib/pypi-build';
import { PROJECTS, releaseProject, type ProjectId } from '@/lib/release-projects';
import { loadProjectReleases } from '@/lib/releases';
import { siteOgImage } from '@/lib/shared';

export function releasesMetadata(id: ProjectId): Metadata {
  const project = releaseProject(id);
  const title = id === 'opentide' ? 'Releases' : `${project.name} releases`;
  const description = `What shipped in each version of ${id === 'opentide' ? 'opentide' : `the opentide ${project.name.toLowerCase()}`}: ${project.description}`;
  return {
    title,
    description,
    alternates: { canonical: project.href },
    openGraph: { title, description, images: siteOgImage },
    twitter: { images: siteOgImage },
  };
}

/** One project's release log, with every project's latest version in the switcher. */
export async function ReleasesPage({ id }: { id: ProjectId }) {
  const [all, pypiVersion] = await Promise.all([
    Promise.all(PROJECTS.map(async (project) => ({ project, releases: await loadProjectReleases(project.id) }))),
    readBuildTimePypiVersion(),
  ]);
  const current = all.find((entry) => entry.project.id === id);
  if (!current) throw new Error(`Unknown release project: ${id}`);

  const projects = all.flatMap(({ project, releases }) => (releases[0] ? [{ project, latest: releases[0] }] : []));
  return (
    <ReleaseLog project={current.project} releases={current.releases} projects={projects} pypiVersion={pypiVersion} />
  );
}
