import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { env } from "./env";

function isAllowedDevOrigin(origin: string) {
  return /^(http:\/\/localhost:\d+|http:\/\/127\.0\.0\.1:\d+|http:\/\/\[::1\]:\d+)$/.test(
    origin,
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || isAllowedDevOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    credentials: true,
  });

  await app.listen(env.port);
}

void bootstrap();
