import { Query, Resolver } from "@nestjs/graphql";
import { ProjectModel } from "./projects.model";
import { ProjectsService } from "./projects.service";

@Resolver(() => ProjectModel)
export class ProjectsResolver {
  constructor(private readonly projectsService: ProjectsService) {}

  @Query(() => [ProjectModel])
  projects() {
    return this.projectsService.findAll();
  }
}
