"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/nodeEntry.ts
var nodeEntry_exports = {};
__export(nodeEntry_exports, {
  runSuperHTTPNode: () => runSuperHTTPNode
});
module.exports = __toCommonJS(nodeEntry_exports);

// src/impl/superHTTP.ts
var import_https = __toESM(require("https"), 1);
var import_http = __toESM(require("http"), 1);
var import_url = require("url");
async function runSuperHTTPNode(config) {
  const { method, url, headers, body, disableSSLVerification, errorOnNon200 } = config;
  const urlObject = new import_url.URL(url);
  const protocol = urlObject.protocol === "https:" ? import_https.default : import_http.default;
  const options = {
    method,
    headers,
    rejectUnauthorized: !disableSSLVerification
    // Handle SSL/TLS verification
  };
  return new Promise((resolve, reject) => {
    const req = protocol.request(url, options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => {
        chunks.push(chunk);
      });
      res.on("end", () => {
        const responseBody = Buffer.concat(chunks).toString();
        const statusCode = res.statusCode ?? 0;
        const responseHeaders = Object.fromEntries(Object.entries(res.headers));
        if (errorOnNon200 && (statusCode < 200 || statusCode >= 300)) {
          reject(new Error(`HTTP error: Status code ${statusCode}`));
          return;
        }
        const output = {
          statusCode,
          res_headers: responseHeaders,
          res_body: responseBody
        };
        if (res.headers["content-type"]?.includes("application/json")) {
          try {
            output.json = JSON.parse(responseBody);
          } catch (error) {
            console.error("JSON parsing error:", error);
            output.json = "Error parsing JSON";
          }
        }
        resolve(output);
      });
    });
    req.on("error", (error) => {
      console.error("HTTP request error:", error);
      reject(new Error("HTTP request error: " + error.message));
    });
    if ((method === "POST" || method === "PUT") && body) {
      req.write(body);
    }
    req.end();
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  runSuperHTTPNode
});
