FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENV DB_FILE=/data/encurtador.db
VOLUME ["/data"]
EXPOSE 3000
CMD ["node", "src/server.js"]
