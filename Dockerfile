FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    g++ \
    make \
    cmake \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN g++ -O3 -std=c++17 server.cpp -o server -lpthread

EXPOSE 8080

CMD ["./server"]