# syntax=docker/dockerfile:1.7

# --- frontend build ---
FROM node:22-alpine AS frontend
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# --- backend build + publish (frontend copied into wwwroot so it ships as static assets) ---
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src
COPY backend/GcpResourcesManager.Api/GcpResourcesManager.Api.csproj ./GcpResourcesManager.Api/
RUN dotnet restore ./GcpResourcesManager.Api/GcpResourcesManager.Api.csproj
COPY backend/ ./
COPY --from=frontend /web/dist ./GcpResourcesManager.Api/wwwroot
RUN dotnet publish ./GcpResourcesManager.Api/GcpResourcesManager.Api.csproj \
    -c Release -o /app/publish --no-restore /p:UseAppHost=false

# --- runtime (small alpine image) ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
WORKDIR /app
COPY --from=build /app/publish ./
RUN mkdir -p /app/keys && chown -R app:app /app
USER app
ENV ASPNETCORE_URLS=http://+:8080 \
    KEYS_DIRECTORY=/app/keys \
    DOTNET_EnableDiagnostics=0
EXPOSE 8080
ENTRYPOINT ["dotnet", "GcpResourcesManager.Api.dll"]
