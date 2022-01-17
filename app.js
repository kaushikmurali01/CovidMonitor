const Datastore = require("nedb");

var confirmed = new Datastore("time_series_confirmed.db");
var deaths = new Datastore("time_series_deaths.db");
var recovered = new Datastore("time_series_recovered.db");
var daily = new Datastore("daily.db");
confirmed.loadDatabase();
deaths.loadDatabase();
recovered.loadDatabase();
daily.loadDatabase();
const converter = require("json-2-csv");

const multer = require("multer");
const csv = require("fast-csv");
// const mongodb = require("mongodb");
const fs = require("fs");
const express = require("express");
// const { count } = require("console");
const app = express();

// Set global directory
global.__basedir = __dirname;

// Multer Upload Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __basedir + "/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname);
  },
});

// Filter for CSV file
const csvFilter = (req, file, cb) => {
  if (file.mimetype.includes("csv")) {
    cb(null, true);
  } else {
    cb("Please upload only csv file.", false);
  }
};
const upload = multer({ storage: storage, fileFilter: csvFilter });

// Upload time series CSV file using Express Rest APIs
app.post("/time_series", upload.single("file"), (req, res) => {
  if (!req.query.type) {
    res.status(500).send({
      message: "Could not upload the file: " + req.file.originalname,
    });
  }

  var database = new Datastore();
  if (req.query.type === "confirmed") {
    database = confirmed;
  }
  if (req.query.type === "deaths") {
    database = deaths;
  }
  if (req.query.type === "recovered") {
    database = recovered;
  }
  let flag = false;
  try {
    if (req.file == undefined) {
      return res.status(400).send({
        message: "Please upload a CSV file!",
      });
    }

    // Import CSV File to nedb database
    let csvData = [];
    let filePath = __basedir + "/uploads/" + req.file.filename;
    let headers = ["Province/State", "Country/Region", "Lat", "Long"];
    var from = new Date("1/22/20");
    var to = new Date("11/5/21");
    for (var day = from; day <= to; day.setDate(day.getDate() + 1)) {
      var dd = String(day.getDate());
      var mm = String(day.getMonth() + 1); //January is 0!
      var yyyy = day.getFullYear().toString();
      const today = mm + "/" + dd + "/" + yyyy.substring(2);
      headers.push(today);
    }

    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true }))
      .on("error", (error) => {
        res.status(500).end();
      })
      .on("data", (row) => {
        csvData.push(row);
        let cnt = 0;
        for (key in row) {
          cnt++;
          if (!headers.includes(key)) {
            throw error;
          }
        }
        if (cnt != headers.length) {
          throw error;
        }
        const data = {
          "Province/State": row["Province/State"],
          "Country/Region": row["Country/Region"],
          Lat: row["Lat"],
          Long: row["Long"],
        };
        database.update(data, row, { upsert: true });
      })
      .on("end", () => {
        database.loadDatabase();
      });
  } catch (error) {
    console.log("catch error-", error);
    res.status(500).send({
      message: "Could not upload the file: " + req.file.originalname,
    });
  }
  res.status(200).send({
    message: "File successfully uploaded: " + req.file.originalname,
  });
});

//query time series data and return data in either csv format or json format
app.get("/time_series", function (req, res) {
  if (!req.query.type) {
    res.status(404).send({
      message: "Could not find the file: " + req.file.originalname,
    });
  }

  var database = new Datastore();
  if (req.query.type === "confirmed") {
    database = confirmed;
  }
  if (req.query.type === "deaths") {
    database = deaths;
  }
  if (req.query.type === "recovered") {
    database = recovered;
  }
  if (
    !(req.query.type === "confirmed") &&
    !(req.query.type === "deaths") &&
    !(req.query.type === "recovered") &&
    !(req.query.type === "active")
  ) {
    res.status(404).send({
      message: "Could not find the file: " + req.file.originalname,
    });
  }

  const data = {};
  let countries_found = false;
  let provinces_found = false;

  const countries = [];
  if (req.query.countries) {
    var country_names = req.query.countries.split(",");
    for (let i = 0; i < country_names.length; i++) {
      const tmp = { "Country/Region": country_names[i] };
      countries.push(tmp);
    }
    countries_found = true;
  }

  const provinces = [];
  if (req.query.provinces) {
    var province_names = req.query.provinces.split(",");
    for (let i = 0; i < province_names.length; i++) {
      const tmp = { "Province/State": province_names[i] };
      provinces.push(tmp);
    }
    provinces_found = true;
  }

  const dates = {};
  if (req.query.dates) {
    dates["Country/Region"] = 1;
    dates["Province/State"] = 1;
    dates["Lat"] = 1;
    dates["Long"] = 1;
    var from_and_to = req.query.dates.split("-");
    if (from_and_to.length == 1) {
      dates[req.query.dates] = 1;
    } else {
      var from = new Date(from_and_to[0]);
      var to = new Date(from_and_to[1]);
      for (var day = from; day <= to; day.setDate(day.getDate() + 1)) {
        var dd = String(day.getDate());
        var mm = String(day.getMonth() + 1); //January is 0!
        var yyyy = day.getFullYear().toString();
        const today = mm + "/" + dd + "/" + yyyy.substring(2);
        dates[today] = 1;
      }
    }
  }

  if (countries_found && provinces_found) {
    if (req.query.type === "active") {
      confirmed.find(
        { $or: countries.map((v) => ({ ...v, $or: provinces })) },
        dates,
        (err, data1) => {
          if (err) {
            res
              .status(404)
              .send({ message: "server could not find requested resource" });
          }
          data1.sort(function (a, b) {
            var textA = a["Country/Region"].toUpperCase();
            var textB = b["Country/Region"].toUpperCase();
            return textA < textB ? -1 : textA > textB ? 1 : 0;
          });
          deaths.find(
            { $or: countries.map((v) => ({ ...v, $or: provinces })) },
            dates,
            (err, data2) => {
              if (err) {
                res.status(404).send({
                  message: "server could not find requested resource",
                });
              }
              data2.sort(function (a, b) {
                var textA = a["Country/Region"].toUpperCase();
                var textB = b["Country/Region"].toUpperCase();
                return textA < textB ? -1 : textA > textB ? 1 : 0;
              });
              recovered.find(
                { $or: countries.map((v) => ({ ...v, $or: provinces })) },
                dates,
                (err, data3) => {
                  if (err) {
                    res.status(404).send({
                      message: "server could not find requested resource",
                    });
                  }
                  data3.sort(function (a, b) {
                    var textA = a["Country/Region"].toUpperCase();
                    var textB = b["Country/Region"].toUpperCase();
                    return textA < textB ? -1 : textA > textB ? 1 : 0;
                  });
                  for (let i = 0; i < data1.length; i++) {
                    for (let j = 0; j < data2.length; j++) {
                      if (
                        data2[j]["Country/Region"] ===
                          data1[i]["Country/Region"] &&
                        data2[j]["Province/State"] ===
                          data1[i]["Province/State"] &&
                        data2[j]["Lat"] === data1[i]["Lat"] &&
                        data2[j]["Long"] === data1[i]["Long"]
                      ) {
                        for (key2 in data2[j]) {
                          if (
                            !(key2 === "Country/Region") &&
                            !(key2 === "Province/State") &&
                            !(key2 === "Lat") &&
                            !(key2 === "Long") &&
                            !(key2 === "_id")
                          ) {
                            let tmp =
                              parseInt(data1[i][key2]) -
                              parseInt(data2[j][key2]);
                            data1[i][key2] = tmp.toString();
                          }
                        }
                      }
                    }
                    for (let j = 0; j < data3.length; j++) {
                      if (
                        data3[j]["Country/Region"] ===
                          data1[i]["Country/Region"] &&
                        data3[j]["Province/State"] ===
                          data1[i]["Province/State"] &&
                        data3[j]["Lat"] === data1[i]["Lat"] &&
                        data3[j]["Long"] === data1[i]["Long"]
                      ) {
                        for (key3 in data3[j]) {
                          if (
                            !(key3 === "Country/Region") &&
                            !(key3 === "Province/State") &&
                            !(key3 === "Lat") &&
                            !(key3 === "Long") &&
                            !(key3 === "_id")
                          ) {
                            let tmp =
                              parseInt(data1[i][key3]) -
                              parseInt(data3[j][key3]);
                            data1[i][key3] = tmp.toString();
                          }
                        }
                      }
                    }
                  }

                  if (req.query.format) {
                    if (req.query.format === "json") {
                      res.json(data1);
                    } else if (req.query.format === "csv") {
                      converter.json2csv(data1, (err, csv) => {
                        if (err) {
                          throw err;
                        }

                        // print CSV string
                        res.send(csv);
                      });
                    } else {
                      res
                        .status(400)
                        .send({ message: "invalid return format" });
                    }
                  } else {
                    res.json(data1);
                  }
                }
              );
            }
          );
        }
      );
    } else {
      database.find(
        { $or: countries.map((v) => ({ ...v, $or: provinces })) },
        dates,
        (err, data) => {
          if (err) {
            res
              .status(404)
              .send({ message: "server could not find requested resource" });
          }
          if (req.query.format) {
            if (req.query.format === "json") {
              res.json(data);
            } else if (req.query.format === "csv") {
              converter.json2csv(data, (err, csv) => {
                if (err) {
                  throw err;
                }

                // print CSV string
                res.send(csv);
              });
            } else {
              res.status(400).send({ message: "invalid return format" });
            }
          } else {
            res.json(data);
          }
        }
      );
    }
  } else if (countries_found) {
    if (req.query.type === "active") {
      confirmed.find({ $or: countries }, dates, (err, data1) => {
        if (err) {
          res
            .status(404)
            .send({ message: "server could not find requested resource" });
        }
        data1.sort(function (a, b) {
          var textA = a["Country/Region"].toUpperCase();
          var textB = b["Country/Region"].toUpperCase();
          return textA < textB ? -1 : textA > textB ? 1 : 0;
        });
        deaths.find({ $or: countries }, dates, (err, data2) => {
          if (err) {
            res
              .status(404)
              .send({ message: "server could not find requested resource" });
          }
          data2.sort(function (a, b) {
            var textA = a["Country/Region"].toUpperCase();
            var textB = b["Country/Region"].toUpperCase();
            return textA < textB ? -1 : textA > textB ? 1 : 0;
          });
          recovered.find({ $or: countries }, dates, (err, data3) => {
            if (err) {
              res
                .status(404)
                .send({ message: "server could not find requested resource" });
            }
            data3.sort(function (a, b) {
              var textA = a["Country/Region"].toUpperCase();
              var textB = b["Country/Region"].toUpperCase();
              return textA < textB ? -1 : textA > textB ? 1 : 0;
            });
            for (let i = 0; i < data1.length; i++) {
              for (let j = 0; j < data2.length; j++) {
                if (
                  data2[j]["Country/Region"] === data1[i]["Country/Region"] &&
                  data2[j]["Province/State"] === data1[i]["Province/State"] &&
                  data2[j]["Lat"] === data1[i]["Lat"] &&
                  data2[j]["Long"] === data1[i]["Long"]
                ) {
                  for (key2 in data2[j]) {
                    if (
                      !(key2 === "Country/Region") &&
                      !(key2 === "Province/State") &&
                      !(key2 === "Lat") &&
                      !(key2 === "Long") &&
                      !(key2 === "_id")
                    ) {
                      let tmp =
                        parseInt(data1[i][key2]) - parseInt(data2[j][key2]);
                      data1[i][key2] = tmp.toString();
                    }
                  }
                }
              }
              for (let j = 0; j < data3.length; j++) {
                if (
                  data3[j]["Country/Region"] === data1[i]["Country/Region"] &&
                  data3[j]["Province/State"] === data1[i]["Province/State"] &&
                  data3[j]["Lat"] === data1[i]["Lat"] &&
                  data3[j]["Long"] === data1[i]["Long"]
                ) {
                  for (key3 in data3[j]) {
                    if (
                      !(key3 === "Country/Region") &&
                      !(key3 === "Province/State") &&
                      !(key3 === "Lat") &&
                      !(key3 === "Long") &&
                      !(key3 === "_id")
                    ) {
                      let tmp =
                        parseInt(data1[i][key3]) - parseInt(data3[j][key3]);
                      data1[i][key3] = tmp.toString();
                    }
                  }
                }
              }
            }

            if (req.query.format) {
              if (req.query.format === "json") {
                res.json(data1);
              } else if (req.query.format === "csv") {
                converter.json2csv(data1, (err, csv) => {
                  if (err) {
                    throw err;
                  }

                  // print CSV string
                  res.send(csv);
                });
              } else {
                res.status(400).send({ message: "invalid return format" });
              }
            } else {
              res.json(data1);
            }
          });
        });
      });
    } else {
      database.find({ $or: countries }, dates, (err, data) => {
        if (err) {
          res
            .status(404)
            .send({ message: "server could not find requested resource" });
        }
        if (req.query.format) {
          if (req.query.format === "json") {
            res.json(data);
          } else if (req.query.format === "csv") {
            converter.json2csv(data, (err, csv) => {
              if (err) {
                throw err;
              }

              // print CSV string
              res.send(csv);
            });
          } else {
            res.status(400).send({ message: "invalid return format" });
          }
        } else {
          res.json(data);
        }
      });
    }
  } else if (provinces_found) {
    if (req.query.type === "active") {
      confirmed.find({ $or: provinces }, dates, (err, data1) => {
        if (err) {
          res
            .status(404)
            .send({ message: "server could not find requested resource" });
        }
        data1.sort(function (a, b) {
          var textA = a["Country/Region"].toUpperCase();
          var textB = b["Country/Region"].toUpperCase();
          return textA < textB ? -1 : textA > textB ? 1 : 0;
        });
        deaths.find({ $or: provinces }, dates, (err, data2) => {
          if (err) {
            res
              .status(404)
              .send({ message: "server could not find requested resource" });
          }
          data2.sort(function (a, b) {
            var textA = a["Country/Region"].toUpperCase();
            var textB = b["Country/Region"].toUpperCase();
            return textA < textB ? -1 : textA > textB ? 1 : 0;
          });
          recovered.find({ $or: provinces }, dates, (err, data3) => {
            if (err) {
              res
                .status(404)
                .send({ message: "server could not find requested resource" });
            }
            data3.sort(function (a, b) {
              var textA = a["Country/Region"].toUpperCase();
              var textB = b["Country/Region"].toUpperCase();
              return textA < textB ? -1 : textA > textB ? 1 : 0;
            });
            for (let i = 0; i < data1.length; i++) {
              for (let j = 0; j < data2.length; j++) {
                if (
                  data2[j]["Country/Region"] === data1[i]["Country/Region"] &&
                  data2[j]["Province/State"] === data1[i]["Province/State"] &&
                  data2[j]["Lat"] === data1[i]["Lat"] &&
                  data2[j]["Long"] === data1[i]["Long"]
                ) {
                  for (key2 in data2[j]) {
                    if (
                      !(key2 === "Country/Region") &&
                      !(key2 === "Province/State") &&
                      !(key2 === "Lat") &&
                      !(key2 === "Long") &&
                      !(key2 === "_id")
                    ) {
                      let tmp =
                        parseInt(data1[i][key2]) - parseInt(data2[j][key2]);
                      data1[i][key2] = tmp.toString();
                    }
                  }
                }
              }
              for (let j = 0; j < data3.length; j++) {
                if (
                  data3[j]["Country/Region"] === data1[i]["Country/Region"] &&
                  data3[j]["Province/State"] === data1[i]["Province/State"] &&
                  data3[j]["Lat"] === data1[i]["Lat"] &&
                  data3[j]["Long"] === data1[i]["Long"]
                ) {
                  for (key3 in data3[j]) {
                    if (
                      !(key3 === "Country/Region") &&
                      !(key3 === "Province/State") &&
                      !(key3 === "Lat") &&
                      !(key3 === "Long") &&
                      !(key3 === "_id")
                    ) {
                      let tmp =
                        parseInt(data1[i][key3]) - parseInt(data3[j][key3]);
                      data1[i][key3] = tmp.toString();
                    }
                  }
                }
              }
            }

            if (req.query.format) {
              if (req.query.format === "json") {
                res.json(data1);
              } else if (req.query.format === "csv") {
                converter.json2csv(data1, (err, csv) => {
                  if (err) {
                    throw err;
                  }

                  // print CSV string
                  res.send(csv);
                });
              } else {
                res.status(400).send({ message: "invalid return format" });
              }
            } else {
              res.json(data1);
            }
          });
        });
      });
    } else {
      database.find({ $or: provinces }, dates, (err, data) => {
        if (err) {
          res
            .status(404)
            .send({ message: "server could not find requested resource" });
        }
        if (req.query.format) {
          if (req.query.format === "json") {
            res.json(data);
          } else if (req.query.format === "csv") {
            converter.json2csv(data, (err, csv) => {
              if (err) {
                throw err;
              }

              // print CSV string
              res.send(csv);
            });
          } else {
            res.status(400).send({ message: "invalid return format" });
          }
        } else {
          res.json(data);
        }
      });
    }
  } else {
    if (req.query.type === "active") {
      confirmed.find({}, dates, (err, data1) => {
        if (err) {
          res
            .status(404)
            .send({ message: "server could not find requested resource" });
        }
        data1.sort(function (a, b) {
          var textA = a["Country/Region"].toUpperCase();
          var textB = b["Country/Region"].toUpperCase();
          return textA < textB ? -1 : textA > textB ? 1 : 0;
        });
        deaths.find({}, dates, (err, data2) => {
          if (err) {
            res
              .status(404)
              .send({ message: "server could not find requested resource" });
          }
          data2.sort(function (a, b) {
            var textA = a["Country/Region"].toUpperCase();
            var textB = b["Country/Region"].toUpperCase();
            return textA < textB ? -1 : textA > textB ? 1 : 0;
          });
          recovered.find({}, dates, (err, data3) => {
            if (err) {
              res
                .status(404)
                .send({ message: "server could not find requested resource" });
            }
            data3.sort(function (a, b) {
              var textA = a["Country/Region"].toUpperCase();
              var textB = b["Country/Region"].toUpperCase();
              return textA < textB ? -1 : textA > textB ? 1 : 0;
            });
            for (let i = 0; i < data1.length; i++) {
              for (let j = 0; j < data2.length; j++) {
                if (
                  data2[j]["Country/Region"] === data1[i]["Country/Region"] &&
                  data2[j]["Province/State"] === data1[i]["Province/State"] &&
                  data2[j]["Lat"] === data1[i]["Lat"] &&
                  data2[j]["Long"] === data1[i]["Long"]
                ) {
                  for (key2 in data2[j]) {
                    if (
                      !(key2 === "Country/Region") &&
                      !(key2 === "Province/State") &&
                      !(key2 === "Lat") &&
                      !(key2 === "Long") &&
                      !(key2 === "_id")
                    ) {
                      let tmp =
                        parseInt(data1[i][key2]) - parseInt(data2[j][key2]);
                      data1[i][key2] = tmp.toString();
                    }
                  }
                }
              }
              for (let j = 0; j < data3.length; j++) {
                if (
                  data3[j]["Country/Region"] === data1[i]["Country/Region"] &&
                  data3[j]["Province/State"] === data1[i]["Province/State"] &&
                  data3[j]["Lat"] === data1[i]["Lat"] &&
                  data3[j]["Long"] === data1[i]["Long"]
                ) {
                  for (key3 in data3[j]) {
                    if (
                      !(key3 === "Country/Region") &&
                      !(key3 === "Province/State") &&
                      !(key3 === "Lat") &&
                      !(key3 === "Long") &&
                      !(key3 === "_id")
                    ) {
                      let tmp =
                        parseInt(data1[i][key3]) - parseInt(data3[j][key3]);
                      data1[i][key3] = tmp.toString();
                    }
                  }
                }
              }
            }

            if (req.query.format) {
              if (req.query.format === "json") {
                res.json(data1);
              } else if (req.query.format === "csv") {
                converter.json2csv(data1, (err, csv) => {
                  if (err) {
                    throw err;
                  }

                  // print CSV string
                  res.send(csv);
                });
              } else {
                res.status(400).send({ message: "invalid return format" });
              }
            } else {
              res.json(data1);
            }
          });
        });
      });
    } else {
      database.find({}, dates, (err, data) => {
        if (err) {
          res
            .status(404)
            .send({ message: "server could not find requested resource" });
        }
        data.sort(function (a, b) {
          var textA = a["Country/Region"].toUpperCase();
          var textB = b["Country/Region"].toUpperCase();
          return textA < textB ? -1 : textA > textB ? 1 : 0;
        });
        if (req.query.format) {
          if (req.query.format === "json") {
            res.json(data);
          } else if (req.query.format === "csv") {
            converter.json2csv(data, (err, csv) => {
              if (err) {
                throw err;
              }

              // print CSV string
              res.send(csv);
            });
          } else {
            res.status(400).send({ message: "invalid return format" });
          }
        } else {
          res.json(data);
        }
      });
    }
  }
});

app.get("/", function (req, res) {
  res.send("Welcome to Covid Monitor");
});

// Upload daily reports CSV file using Express Rest APIs
app.post("/daily_reports", upload.single("file"), (req, res) => {
  if (!req.query.type) {
    res.status(404).send({
      message: "Could not find the file: " + req.file.originalname,
    });
  }

  var database = new Datastore();
  database = daily;

  try {
    if (req.file == undefined) {
      return res.status(400).send({
        message: "Please upload a CSV file!",
      });
    }

    // Import CSV File to nedb database
    let csvData = [];
    let filePath = __basedir + "/uploads/" + req.file.filename;
    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true }))
      .on("error", (error) => {
        throw error.message;
      })
      .on("data", (row) => {
        csvData.push(row);
        delete row["FIPS"];
        delete row["Admin2"];
        row["date"] = req.query.type;
        const data = {
          Province_State: row["Province_State"],
          Country_Region: row["Country_Region"],
          Combined_Key: row["Combined_Key"],
          Lat: row["Lat"],
          Long_: row["Long_"],
          date: row["date"],
        };
        database.update(data, row, { upsert: true });
      })
      .on("end", () => {
        database.loadDatabase();
      });
  } catch (error) {
    console.log("catch error-", error);
    res.status(500).send({
      message: "Could not upload the file: " + req.file.originalname,
    });
  }
  res.status(200).send({
    message: "File successfully uploaded: " + req.file.originalname,
  });
});

//query daily reports data and return data in either csv format or json format
app.get("/daily_reports", function (req, res) {
  var database = new Datastore();
  database = daily;

  const data = {};
  let countries_found = false;
  let provinces_found = false;

  const countries = [];
  if (req.query.countries) {
    var country_names = req.query.countries.split(",");
    for (let i = 0; i < country_names.length; i++) {
      const tmp = { Country_Region: country_names[i] };
      countries.push(tmp);
    }
    countries_found = true;
  }

  const provinces = [];
  if (req.query.provinces) {
    var province_names = req.query.provinces.split(",");
    for (let i = 0; i < province_names.length; i++) {
      const tmp = { Province_State: province_names[i] };
      provinces.push(tmp);
    }
    provinces_found = true;
  }

  const dates = {};
  dates["Country_Region"] = 1;
  dates["Province_State"] = 1;
  dates["Lat"] = 1;
  dates["Long_"] = 1;
  dates["Confirmed"] = 1;
  dates["Deaths"] = 1;
  dates["Recovered"] = 1;
  dates["Active"] = 1;
  dates["date"] = 1;

  let dates_lst = [];
  if (req.query.dates) {
    var from_and_to = req.query.dates.split("-");
    if (from_and_to.length == 1) {
      dates_lst.push({ date: req.query.dates });
    } else {
      var from = new Date(from_and_to[0]);
      var to = new Date(from_and_to[1]);
      for (var day = from; day <= to; day.setDate(day.getDate() + 1)) {
        var dd = String(day.getDate());
        var mm = String(day.getMonth() + 1); //January is 0!
        var yyyy = day.getFullYear().toString();
        const today = mm + "/" + dd + "/" + yyyy.substring(2);
        let tmp = { date: today };
        dates_lst.push(tmp);
      }
    }
  } else {
    var from = new Date("1/1/20");
    var to = new Date("1/1/22");
    for (var day = from; day <= to; day.setDate(day.getDate() + 1)) {
      var dd = String(day.getDate());
      var mm = String(day.getMonth() + 1); //January is 0!
      var yyyy = day.getFullYear().toString();
      const today = mm + "/" + dd + "/" + yyyy.substring(2);
      let tmp = { date: today };
      dates_lst.push(tmp);
    }
  }

  if (countries_found && provinces_found) {
    database.find(
      {
        $or: countries.map((v) => ({
          ...v,
          $or: provinces.map((a) => ({ ...a, $or: dates_lst })),
        })),
      },
      dates,
      (err, data) => {
        if (err) {
          res
            .status(404)
            .send({ message: "server could not find requested resource" });
        }
        //sort data by time
        data.sort(function (a, b) {
          var textA = new Date(a.date);
          var textB = new Date(b.date);
          return textA < textB ? -1 : textA > textB ? 1 : 0;
        });
        let group = data.reduce((r, a) => {
          r[a["date"]] = [...(r[a["date"]] || []), a];
          return r;
        }, {});
        if (req.query.format) {
          if (req.query.format === "json") {
            res.json(group);
          } else if (req.query.format === "csv") {
            converter.json2csv(data, (err, csv) => {
              if (err) {
                throw err;
              }

              // print CSV string
              res.send(csv);
            });
          } else {
            res.status(400).send({ message: "invalid return format" });
          }
        } else {
          res.json(group);
        }
      }
    );
  } else if (countries_found) {
    database.find(
      { $or: countries.map((a) => ({ ...a, $or: dates_lst })) },
      dates,
      (err, data) => {
        if (err) {
          res
            .status(404)
            .send({ message: "server could not find requested resource" });
        }
        //sort data by time
        data.sort(function (a, b) {
          var textA = new Date(a.date);
          var textB = new Date(b.date);
          return textA < textB ? -1 : textA > textB ? 1 : 0;
        });
        let group = data.reduce((r, a) => {
          r[a["date"]] = [...(r[a["date"]] || []), a];

          return r;
        }, {});
        if (req.query.format) {
          if (req.query.format === "json") {
            res.json(group);
          } else if (req.query.format === "csv") {
            converter.json2csv(data, (err, csv) => {
              if (err) {
                throw err;
              }

              // print CSV string
              res.send(csv);
            });
          } else {
            res.status(400).send({ message: "invalid return format" });
          }
        } else {
          res.json(group);
        }
      }
    );
  } else if (provinces_found) {
    database.find(
      { $or: provinces.map((a) => ({ ...a, $or: dates_lst })) },
      dates,
      (err, data) => {
        if (err) {
          res
            .status(404)
            .send({ message: "server could not find requested resource" });
        }
        //sort data by time
        data.sort(function (a, b) {
          var textA = new Date(a.date);
          var textB = new Date(b.date);
          return textA < textB ? -1 : textA > textB ? 1 : 0;
        });
        let group = data.reduce((r, a) => {
          r[a["date"]] = [...(r[a["date"]] || []), a];
          return r;
        }, {});
        if (req.query.format) {
          if (req.query.format === "json") {
            res.json(group);
          } else if (req.query.format === "csv") {
            converter.json2csv(data, (err, csv) => {
              if (err) {
                throw err;
              }

              // print CSV string
              res.send(csv);
            });
          } else {
            res.status(400).send({ message: "invalid return format" });
          }
        } else {
          res.json(group);
        }
      }
    );
  } else {
    database.find({}, dates, (err, data) => {
      if (err) {
        res
          .status(404)
          .send({ message: "server could not find requested resource" });
      }
      //sort data by time
      data.sort(function (a, b) {
        var textA = new Date(a.date);
        var textB = new Date(b.date);
        return textA < textB ? -1 : textA > textB ? 1 : 0;
      });
      let group = data.reduce((r, a) => {
        r[a["date"]] = [...(r[a["date"]] || []), a];
        return r;
      }, {});
      if (req.query.format) {
        if (req.query.format === "json") {
          res.json(group);
        } else if (req.query.format === "csv") {
          converter.json2csv(data, (err, csv) => {
            if (err) {
              throw err;
            }

            // print CSV string
            res.send(csv);
          });
        } else {
          res.status(400).send({ message: "invalid return format" });
        }
      } else {
        res.json(group);
      }
    });
  }
});

module.exports = app;
