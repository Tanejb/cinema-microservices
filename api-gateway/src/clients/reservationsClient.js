const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const PROTO_PATH = path.join(__dirname, "../../proto/reservations.proto");

function requestMetadata(requestId) {
  const metadata = new grpc.Metadata();
  if (requestId) {
    metadata.set("x-request-id", String(requestId));
  }
  return metadata;
}

function createReservationsClient(address) {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const proto = grpc.loadPackageDefinition(packageDefinition).reservations.v1;
  const client = new proto.ReservationsService(
    address,
    grpc.credentials.createInsecure(),
  );

  return {
    createReservation(payload, requestId) {
      return new Promise((resolve, reject) => {
        client.CreateReservation(
          payload,
          requestMetadata(requestId),
          (err, response) => {
            if (err) return reject(err);
            resolve(response);
          },
        );
      });
    },
    getReservationById(id, requestId) {
      return new Promise((resolve, reject) => {
        client.GetReservationById(
          { id },
          requestMetadata(requestId),
          (err, response) => {
            if (err) return reject(err);
            resolve(response);
          },
        );
      });
    },
    listReservationsByScreening(screeningId, requestId) {
      return new Promise((resolve, reject) => {
        client.ListReservationsByScreening(
          { screening_id: screeningId },
          requestMetadata(requestId),
          (err, response) => {
            if (err) return reject(err);
            resolve(response);
          },
        );
      });
    },
    cancelReservation(id, requestId) {
      return new Promise((resolve, reject) => {
        client.CancelReservation(
          { id },
          requestMetadata(requestId),
          (err, response) => {
            if (err) return reject(err);
            resolve(response);
          },
        );
      });
    },
  };
}

module.exports = { createReservationsClient };
