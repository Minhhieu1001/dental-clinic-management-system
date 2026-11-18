# syntax=docker/dockerfile:1
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /build
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
COPY src src
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -DskipTests package

FROM eclipse-temurin:21-jre-noble
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl libtesseract-dev tesseract-ocr fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 --create-home app
WORKDIR /app
COPY --from=build /build/target/backend-*.jar app.jar
COPY src/main/resources/tessdata/ tessdata/
RUN mkdir -p uploads data && chown -R app:app /app
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
