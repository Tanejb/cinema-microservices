const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const PROTO_PATH = path.join(__dirname, "../../proto/reservations.proto");

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
    createReservation(payload) {
      return new Promise((resolve, reject) => {
        client.CreateReservation(payload, (err, response) => {
          if (err) return reject(err);
          resolve(response);
        });
      });
    },
    getReservationById(id) {
      return new Promise((resolve, reject) => {
        client.GetReservationById({ id }, (err, response) => {
          if (err) return reject(err);
          resolve(response);
        });
      });
    },
    listReservationsByScreening(screeningId) {
      return new Promise((resolve, reject) => {
        client.ListReservationsByScreening(
          { screening_id: screeningId },
          (err, response) => {
            if (err) return reject(err);
            resolve(response);
          },
        );
      });
    },
    cancelReservation(id) {
      return new Promise((resolve, reject) => {
        client.CancelReservation({ id }, (err, response) => {
          if (err) return reject(err);
          resolve(response);
        });
      });
    },
  };
}

module.exports = { createReservationsClient };
