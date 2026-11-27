# syntax=docker/dockerfile:1
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml ./
COPY maven-settings.xml ./
COPY src src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -s maven-settings.xml -DskipTests \
    -Daether.transport.http.retryHandler.count=5 \
    -Daether.transport.http.retryHandler.interval=10000 \
    package

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
