import { Module } from "@nestjs/common";
import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import { GraphQLModule } from "@nestjs/graphql";
import { join } from "node:path";
import { DocumentsModule } from "./modules/documents/documents.module";
import { NotesModule } from "./modules/notes/notes.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { ToolsModule } from "./modules/tools/tools.module";

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: join(process.cwd(), "schema.gql"),
      driver: ApolloDriver,
      sortSchema: true,
    }),
    ToolsModule,
    NotesModule,
    DocumentsModule,
    ProjectsModule,
  ],
})
export class AppModule {}
