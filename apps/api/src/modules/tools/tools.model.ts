import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType("Tool")
export class ToolModel {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  description!: string;

  @Field(() => String)
  category!: string;

  @Field(() => String)
  status!: string;

  @Field(() => String)
  accentColor!: string;

  @Field(() => String)
  iconName!: string;
}
