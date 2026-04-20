# syntax=docker/dockerfile:1.7

# --- frontend build (runs natively on build host for speed) ---
FROM --platform=$BUILDPLATFORM node:22-alpine AS frontend
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# --- backend build + publish (runs natively, produces portable IL that works on any runtime arch) ---
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src
COPY backend/GcpResourcesManager.Api/GcpResourcesManager.Api.csproj ./GcpResourcesManager.Api/
RUN dotnet restore ./GcpResourcesManager.Api/GcpResourcesManager.Api.csproj
COPY backend/ ./
COPY --from=frontend /web/dist ./GcpResourcesManager.Api/wwwroot
RUN dotnet publish ./GcpResourcesManager.Api/GcpResourcesManager.Api.csproj \
      -c Release -o /app/publish --no-restore /p:UseAppHost=false \
 && mkdir -p /app/publish/keys

# --- runtime (chiseled distroless, per-arch selected by buildx) ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled AS runtime
WORKDIR /app
COPY --from=build --chown=app:app /app/publish ./
USER app
ENV ASPNETCORE_URLS=http://+:8080 \
    KEYS_DIRECTORY=/app/keys \
    DOTNET_EnableDiagnostics=0
EXPOSE 8080
ENTRYPOINT ["dotnet", "GcpResourcesManager.Api.dll"]
