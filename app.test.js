const request = require("supertest");
const app = require("./app");
jest.setTimeout(100000);

//POST request for time_series testing
describe("POST /time_series", () => {
  describe("when csv file is given with query parameter type confirmed", () => {
    test("should respond with a 200 status code", async () => {
      const response = await request(app)
        .post("/time_series")
        .query({ type: "confirmed" })
        .attach(
          "file",
          "./uploads/file-1636314044826-time_series_covid19_confirmed_global.csv"
        );
      expect(response.statusCode).toBe(200);
    });
    test("should respond with a 200 status code", async () => {
      const response = await request(app)
        .post("/time_series")
        .query({ type: "confirmed" })
        .attach(
          "file",
          "./uploads/file-1636314044826-time_series_covid19_confirmed_global.csv"
        );
      expect(response.statusCode).toBe(200);
    });
  });
  describe("when csv file is not given", () => {
    test("should respond with a 200 status code", async () => {
      const response = await request(app)
        .post("/time_series")
        .query({ type: "confirmed" });
      expect(response.statusCode).toBe(400);
    });
  });
});

//GET request for time_series testing
describe("GET /time_series", () => {
  describe("when we we want active data and we query by countries and provinces and dates and format=json", () => {
    test("should respond with 200 status code", async () => {
      const response = await request(app).get("/time_series").query({
        type: "active",
        countries: "Canada, China",
        provinces: "Diamond Princess,Yukon,Tibet",
        dates: "6/4/20-6/10/20",
        format: "json",
      });
      expect(response.statusCode).toBe(200);
    });
  });
  describe("when we we want active data and we query by countries only and format=json", () => {
    test("should respond with 200 status code", async () => {
      const response = await request(app).get("/time_series").query({
        type: "active",
        countries: "Canada, China",
        format: "json",
      });
      expect(response.statusCode).toBe(200);
    });
  });
  describe("when we we want active data and we query by provinces only and format=json", () => {
    test("should respond with 200 status code", async () => {
      const response = await request(app).get("/time_series").query({
        type: "active",
        provinces: "Diamond Princess,Yukon,Tibet",
        format: "json",
      });
      expect(response.statusCode).toBe(200);
    });
  });
  describe("when we we want active data and we dont have any queries except format=json", () => {
    test("should respond with 200 status code", async () => {
      const response = await request(app).get("/time_series").query({
        type: "active",
        format: "json",
      });
      expect(response.statusCode).toBe(200);
    });
  });
  describe("when we we want confirmed data and we query by countries and provinces and dates and format=json", () => {
    test("should respond with 200 status code", async () => {
      const response = await request(app).get("/time_series").query({
        type: "confirmed",
        countries: "Canada, China",
        provinces: "Diamond Princess,Yukon,Tibet",
        dates: "6/4/20-6/10/20",
        format: "json",
      });
      expect(response.statusCode).toBe(200);
    });
  });
  describe("when we we want confirmed data and we query by countries only and format=json", () => {
    test("should respond with 200 status code", async () => {
      const response = await request(app).get("/time_series").query({
        type: "confirmed",
        countries: "Canada, China",
        format: "json",
      });
      expect(response.statusCode).toBe(200);
    });
  });
  describe("when we we want confirmed data and we query by provinces only and format=json", () => {
    test("should respond with 200 status code", async () => {
      const response = await request(app).get("/time_series").query({
        type: "confirmed",
        provinces: "Diamond Princess,Yukon,Tibet",
        format: "json",
      });
      expect(response.statusCode).toBe(200);
    });
  });
  describe("when we we want confirmed data and we dont have any queries except format=json", () => {
    test("should respond with 200 status code", async () => {
      const response = await request(app).get("/time_series").query({
        type: "confirmed",
        format: "json",
      });
      expect(response.statusCode).toBe(200);
    });
  });
  describe("when we we want confirmed data and we query by countries and provinces and dates and format=csv", () => {
    test("should respond with 200 status code", async () => {
      const response = await request(app).get("/time_series").query({
        type: "confirmed",
        countries: "Canada, China",
        provinces: "Diamond Princess,Yukon,Tibet",
        dates: "6/4/20-6/10/20",
        format: "csv",
      });
      expect(response.statusCode).toBe(200);
    });
  });
  describe("when we we want confirmed data and we query by countries only and format=csv", () => {
    test("should respond with 200 status code", async () => {
      const response = await request(app).get("/time_series").query({
        type: "confirmed",
        countries: "Canada, China",
        format: "csv",
      });
      expect(response.statusCode).toBe(200);
    });
  });
  describe("when we we want confirmed data and we query by provinces only and format=csv", () => {
    test("should respond with 200 status code", async () => {
      const response = await request(app).get("/time_series").query({
        type: "confirmed",
        provinces: "Diamond Princess,Yukon,Tibet",
        format: "csv",
      });
      expect(response.statusCode).toBe(200);
    });
  });
  describe("when we we want confirmed data and we dont have any queries except format=csv", () => {
    test("should respond with 200 status code", async () => {
      const response = await request(app).get("/time_series").query({
        type: "confirmed",
        format: "csv",
      });
      expect(response.statusCode).toBe(200);
    });
  });
});

//POST request for daily_reports testing
describe("POST /daily_reports", () => {
  describe("when csv file is given with query parameter type 10/2/20", () => {
    test("should respond with a 200 status code", async () => {
      const response = await request(app)
        .post("/daily_reports")
        .query({ type: "10/2/20" })
        .attach("file", "./uploads/file-1636400074595-01-10-2021.csv");
      expect(response.statusCode).toBe(200);
    });
    test("should respond with a 200 status code", async () => {
      const response = await request(app)
        .post("/daily_reports")
        .query({ type: "10/2/20" })
        .attach("file", "./uploads/file-1636400074595-01-10-2021.csv");
      expect(response.statusCode).toBe(200);
    });
  });
  describe("when csv file is not given", () => {
    test("should respond with a 200 status code", async () => {
      const response = await request(app)
        .post("/daily_reports")
        .query({ type: "10/2/20" });
      expect(response.statusCode).toBe(400);
    });
  });
});

//GET request for daily_reports testing
describe("GET /daily_reports", () => {
  describe("when we want to query by countries and provinces and dates and format=csv", () => {
    test("should respond with 200 status code", async () => {
      const response = await request(app).get("/daily_reports").query({
        countries: "Canada, China",
        provinces: "Diamond Princess,Yukon,Tibet",
        dates: "10/2/20",
        format: "csv",
      });
      expect(response.statusCode).toBe(200);
    });
  });
  describe("when we we want active data and we query by countries only and format=csv", () => {
    test("should respond with 200 status code", async () => {
      const response = await request(app).get("/daily_reports").query({
        countries: "China",
        dates: "10/2/20",
        format: "csv",
      });
      expect(response.statusCode).toBe(200);
    });
  });
  describe("when we we want active data and we query by provinces only and format=csv", () => {
    test("should respond with 200 status code", async () => {
      const response = await request(app).get("/daily_reports").query({
        provinces: "Diamond Princess,Yukon,Tibet",
        dates: "10/2/20",
        format: "csv",
      });
      expect(response.statusCode).toBe(200);
    });
  });
  describe("when we we want active data and we dont have any queries except format=csv", () => {
    test("should respond with 200 status code", async () => {
      const response = await request(app).get("/daily_reports").query({
        format: "csv",
        dates: "10/2/20",
      });
      expect(response.statusCode).toBe(200);
    });
  });
});
