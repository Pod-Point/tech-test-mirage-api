import {
  belongsTo,
  createServer as mirageCreateServer,
  Factory,
  hasMany,
  Model,
  Serializer,
  Response,
} from "miragejs";
import faker from "faker";
import { addHours, isMatch } from "date-fns";
import { castIdsToIntegers } from "./utils";

faker.locale = "en_GB";

export function createServer(options) {
  return new mirageCreateServer({
    namespace: "/api",

    models,

    serializers,

    factories,

    seeds,

    routes() {
      this.get("/units");

      this.get("/units/:id", (schema, request) => {
        const unitId = request.params.id;
        const unit = schema.units.find(unitId);

        if (!unit) {
          return notFoundResponse(`Unit [ID ${unitId}] not found.`);
        }

        return unit;
      });

      this.post("/units/:id/charges", (schema, request) => {
        const { started_at } = JSON.parse(request.requestBody);

        if (!started_at) {
          return validationErrorResponse(
            "started_at",
            "The date and time the charge started at is required."
          );
        }

        if (!isValidDateTime(started_at)) {
          return validationErrorResponse(
            "started_at",
            "The date and time the charge started at must be a valid ISO 8601 date time string."
          );
        }

        const unitId = request.params.id;
        const unit = schema.units.find(unitId);

        if (!unit) {
          return notFoundResponse(`Unit [ID ${unitId}] not found.`);
        }

        unit.update({ status: "charging" });
        unit.createCharge({
          started_at,
          finished_at: null,
        });
      });

      this.patch("/units/:unitId/charges/:chargeId", (schema, request) => {
        const unitId = request.params.unitId;
        const unit = schema.units.find(unitId);

        if (!unit) {
          return notFoundResponse(`Unit [ID ${unitId}] not found.`);
        }

        const chargeId = request.params.chargeId;
        const charge = schema.charges.find(chargeId);

        if (!charge) {
          return notFoundResponse(`Charge [ID ${chargeId}] not found.`);
        }

        const { finished_at } = JSON.parse(request.requestBody);

        if (!finished_at) {
          return validationErrorResponse(
            "finished_at",
            "The date and time the charge finished at is required."
          );
        }

        if (!isValidDateTime(finished_at)) {
          return validationErrorResponse(
            "finished_at",
            "The date and time the charge finished at must be a valid ISO 8601 date time string."
          );
        }

        unit.update({ status: "available" });
        charge.update({ finished_at });
      });
    },

    ...options,
  });
}

const models = {
  unit: Model.extend({
    charges: hasMany(),
  }),
  charge: Model.extend({
    unit: belongsTo(),
  }),
};

const applicationSerializer = Serializer.extend({
  embed: true,
  keyForCollection() {
    return "data";
  },
  keyForModel() {
    return "data";
  },
  serialize() {
    return castIdsToIntegers(
      Serializer.prototype.serialize.apply(this, arguments)
    );
  },
});

const serializers = {
  application: applicationSerializer,
  unit: applicationSerializer.extend({ include: ["charges"] }),
};

const factories = {
  unit: Factory.extend({
    name() {
      return faker.company.companyName();
    },
    address() {
      return faker.address.streetAddress(true);
    },
    postcode() {
      return faker.address.zipCode();
    },
    status: "available",
  }),

  charge: Factory.extend({
    started_at() {
      return faker.date.past().toISOString();
    },
    finished_at() {
      const startedAt = Date.parse(this.started_at);
      return addHours(startedAt, 1).toISOString();
    },
  }),
};

function seeds(server) {
  server.create("unit", {
    name: "Pod Point Office",
    address: "Discovery House, 28–42 Banner Street",
    postcode: "EC1Y 8QE",
    charges: server.createList("charge", 3),
  });

  server.create("unit", {
    name: "Horseferry Road",
    address: "Horseferry Road",
    postcode: "SW1P 2AF",
    status: "charging",
    charges: [server.create("charge", { finished_at: null })],
  });

  server.create("unit", {
    name: "Tesco Kensington",
    address: "West Cromwell Road",
    postcode: "W14 8P8",
    charges: server.createList("charge", 2),
  });

  server.create("unit", {
    name: "Putney Exchange Shopping Center",
    address: "Putney High St",
    postcode: "SW15 1TW",
    charges: server.createList("charge", 2),
  });

  server.create("unit", {
    name: "University of Bath (East Car Park)",
    address: "Claverton Down",
    postcode: "BA 7PJ",
    charges: [
      server.create("charge"),
      server.create("charge", { finished_at: null }),
    ],
  });
}

function isValidDateTime(string) {
  return isMatch(string, "yyyy-MM-dd'T'HH:mm:ssxxx");
}

function validationErrorResponse(key, error) {
  return new Response(
    422,
    {},
    {
      errors: {
        [key]: [error],
      },
    }
  );
}

function notFoundResponse(message) {
  return new Response(404, {}, { message });
}
