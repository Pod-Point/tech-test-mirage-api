import {
  belongsTo,
  createServer as mirageCreateServer,
  Factory,
  hasMany,
  Model,
  Serializer,
} from "miragejs";
import faker from "faker";
import { addHours } from "date-fns";
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

      this.get("/units/:id");

      this.post("/units/:id/charges", (schema, request) => {
        let unit = schema.units.find(request.params.id);

        unit.update({ status: "charging" });
        unit.createCharge({
          ...JSON.parse(request.requestBody),
          finished_at: null,
        });
      });

      this.patch("/units/:unitId/charges/:chargeId", (schema, request) => {
        let unit = schema.units.find(request.params.unitId);
        let charge = schema.charges.find(request.params.chargeId);

        unit.update({ status: "available" });
        charge.update(JSON.parse(request.requestBody));
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
  server.createList("unit", 3).forEach((unit) => {
    server.createList("charge", Math.floor(Math.random() * 9), { unit });
  });
}
