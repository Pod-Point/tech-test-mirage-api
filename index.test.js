import { createServer } from "./index";

let server;
beforeEach(() => {
  server = createServer({ environment: "test" });
});

afterEach(() => {
  server.shutdown();
});

test("listing units", async () => {
  server.create("unit", {
    name: "Pod Point Office",
    address: "Discovery House, 28–42 Banner Street",
    postcode: "EC1Y 8QE",
    status: "available",
    charges: [
      server.create("charge", {
        started_at: "1965-04-19T19:23:03+00:00",
        finished_at: "1999-04-02T22:01:19+00:00",
      }),
      server.create("charge", {
        started_at: "1961-01-04T04:22:07+00:00",
        finished_at: "1997-03-20T12:33:12+00:00",
      }),
    ],
  });

  server.create("unit", {
    name: "Horseferry Road",
    address: "Horseferry Road",
    postcode: "SW1P 2AF",
    status: "available",
    charges: [],
  });

  const response = await fetch("/api/units");

  expect(response.status).toBe(200);

  const json = await response.json();

  expect(json.data).toStrictEqual([
    {
      id: 1,
      name: "Pod Point Office",
      address: "Discovery House, 28–42 Banner Street",
      postcode: "EC1Y 8QE",
      status: "available",
      charges: [
        {
          id: 1,
          started_at: "1965-04-19T19:23:03+00:00",
          finished_at: "1999-04-02T22:01:19+00:00",
        },
        {
          id: 2,
          started_at: "1961-01-04T04:22:07+00:00",
          finished_at: "1997-03-20T12:33:12+00:00",
        },
      ],
    },
    {
      id: 2,
      name: "Horseferry Road",
      address: "Horseferry Road",
      postcode: "SW1P 2AF",
      status: "available",
      charges: [],
    },
  ]);
});

test("viewing a unit", async () => {
  const id = 123;
  server.create("unit", {
    id,
    name: "Pod Point Office",
    address: "Discovery House, 28–42 Banner Street",
    postcode: "EC1Y 8QE",
    status: "available",
    charges: [
      server.create("charge", {
        started_at: "1965-04-19T19:23:03+00:00",
        finished_at: "1999-04-02T22:01:19+00:00",
      }),
      server.create("charge", {
        started_at: "1961-01-04T04:22:07+00:00",
        finished_at: "1997-03-20T12:33:12+00:00",
      }),
    ],
  });

  const response = await fetch(`/api/units/${id}`);

  expect(response.status).toBe(200);

  const json = await response.json();

  expect(json.data).toStrictEqual({
    id,
    name: "Pod Point Office",
    address: "Discovery House, 28–42 Banner Street",
    postcode: "EC1Y 8QE",
    status: "available",
    charges: [
      {
        id: 1,
        started_at: "1965-04-19T19:23:03+00:00",
        finished_at: "1999-04-02T22:01:19+00:00",
      },
      {
        id: 2,
        started_at: "1961-01-04T04:22:07+00:00",
        finished_at: "1997-03-20T12:33:12+00:00",
      },
    ],
  });
});

test("viewing a non-existent unit", async () => {
  const response = await fetch("/api/units/123");

  expect(response.status).toBe(404);
  expect(await response.json()).toStrictEqual({
    message: "Unit [ID 123] not found.",
  });
});

test("starting a charge", async () => {
  const unitId = 123;
  server.create("unit", { id: unitId, charges: [] });

  const response = await fetch(`/api/units/${unitId}/charges`, {
    method: "POST",
    body: JSON.stringify({
      started_at: "1965-04-19T19:23:03+00:00",
    }),
  });

  expect(response.status).toBe(201);

  const unit = (await (await fetch(`/api/units/${unitId}`)).json()).data;

  expect(unit.status).toBe("charging");
  expect(unit.charges).toStrictEqual([
    {
      id: 1,
      started_at: "1965-04-19T19:23:03+00:00",
      finished_at: null,
    },
  ]);
});

test("starting a charge on a non-existent unit", async () => {
  const response = await fetch("/api/units/123/charges", {
    method: "POST",
    body: JSON.stringify({
      started_at: "1965-04-19T19:23:03+00:00",
    }),
  });

  expect(response.status).toBe(404);
  expect(await response.json()).toStrictEqual({
    message: "Unit [ID 123] not found.",
  });
});

test("started_at is required", async () => {
  const response = await fetch("/api/units/123/charges", {
    method: "POST",
    body: JSON.stringify({}),
  });

  expect(response.status).toBe(422);
  expect(await response.json()).toStrictEqual({
    errors: {
      started_at: ["The date and time the charge started at is required."],
    },
  });
});

test("started_at must be an ISO 8601 datetime", async () => {
  const response = await fetch("/api/units/123/charges", {
    method: "POST",
    body: JSON.stringify({
      started_at: "1965-04-19",
    }),
  });

  expect(response.status).toBe(422);
  expect(await response.json()).toStrictEqual({
    errors: {
      started_at: [
        "The date and time the charge started at must be a valid ISO 8601 date time string.",
      ],
    },
  });
});

test("finishing a charge", async () => {
  const unitId = 123;
  const chargeId = 456;
  server.create("unit", {
    id: unitId,
    charges: [
      server.create("charge", {
        id: 456,
        started_at: "1965-04-19T19:23:03+00:00",
        finished_at: null,
      }),
    ],
  });

  await fetch(`/api/units/${unitId}/charges/${chargeId}`, {
    method: "PATCH",
    body: JSON.stringify({
      finished_at: "1999-04-02T22:01:19+00:00",
    }),
  });

  let response = await fetch(`/api/units/${unitId}`);

  expect(response.status).toBe(200);

  const unit = (await response.json()).data;

  expect(unit.status).toBe("available");
  expect(unit.charges).toStrictEqual([
    {
      id: chargeId,
      started_at: "1965-04-19T19:23:03+00:00",
      finished_at: "1999-04-02T22:01:19+00:00",
    },
  ]);
});
