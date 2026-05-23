import { Query, Resolver } from "@nestjs/graphql";
import { ToolModel } from "./tools.model";
import { ToolsService } from "./tools.service";

@Resolver(() => ToolModel)
export class ToolsResolver {
  constructor(private readonly toolsService: ToolsService) {}

  @Query(() => [ToolModel])
  tools() {
    return this.toolsService.findAll();
  }
}
