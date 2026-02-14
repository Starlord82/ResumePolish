FROM node:20-slim

# Install LibreOffice for DOCX->PDF conversion
RUN apt-get update && \
    apt-get install -y --no-install-recommends libreoffice-writer && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

EXPOSE 3001
CMD ["node", "dist/index.js"]
