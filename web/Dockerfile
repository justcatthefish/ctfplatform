FROM golang:1.13.4-alpine3.10 as builder
WORKDIR /code/
COPY . .
RUN go build -v ./cmd/main/

FROM alpine:3.10
RUN apk add --no-cache curl

WORKDIR /root/
COPY --from=builder /code/main .
CMD ["./main"]
