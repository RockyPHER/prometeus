import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType("Project")
export class ProjectModel {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String)
  createdAt!: string;

  @Field(() => String, { nullable: true })
  updatedAt?: string;
}
