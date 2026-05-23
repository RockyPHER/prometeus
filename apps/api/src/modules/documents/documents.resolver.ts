import { Query, Resolver } from "@nestjs/graphql";
import { DocumentModel } from "./documents.model";
import { DocumentsService } from "./documents.service";

@Resolver(() => DocumentModel)
export class DocumentsResolver {
  constructor(private readonly documentsService: DocumentsService) {}

  @Query(() => [DocumentModel])
  documents() {
    return this.documentsService.findAll();
  }
}
